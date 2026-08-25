#!/usr/bin/env python3
"""
> GOS3 - agente: Claude - papel: Proposer (ver docs/team.md)
> fase: Technical Refinement - data: 2026-08-25
> antes: ram_calc usava statvfs(/dev/shm) que retorna disco, nao RAM real
> depois: usa Shmem de /proc/meminfo + verifica se tmpfs real via findmnt
>   ramdisk_disponivel = 0 se /dev/shm nao for mount tmpfs separado
> base: auditoria GPT (evidencia fechada) - 2026-08-25
> assinatura: Claude - Proposer - GOS3
> status: PROPOSED - nao executado ainda

ram_calc.py -- Budget de RAM e ramdisk para apps GOS3.

CORRECAO CRITICA vs versao anterior:
  /dev/shm medido via statvfs() retorna o tamanho do filesystem subjacente
  (ex: dm-4, 108GB de disco) -- NAO a RAM alocada como shared memory.
  Leitura correta: campo Shmem de /proc/meminfo (~14MB no Alpine/Termux).
  Se /dev/shm nao for mount tmpfs separado, ramdisk_disponivel = 0.

Uso:
    python3 ram_calc.py [--apps ~/xAI ~/vortex] [--snapshot-interval 300]
"""

import argparse
import os
import subprocess
import json
from dataclasses import dataclass, field
from pathlib import Path

MB = 1024 * 1024

EXEC_OVERHEAD = {
    "node":    (180, "Node.js runtime + V8 heap base"),
    "python":  (60,  "CPython interpreter"),
    "tsx":     (220, "tsx = Node + ts-node + TypeScript compiler"),
    "fastapi": (80,  "FastAPI + uvicorn + pydantic"),
    "vite":    (150, "Vite dev server + HMR"),
}


@dataclass
class AppProfile:
    name: str
    path: str
    disk_mb: float = 0
    deps_mb: float = 0
    exec_overhead_mb: float = 0
    snapshot_mb: float = 0
    total_ram_mb: float = 0
    ramdisk_mb: float = 0
    app_type: str = "unknown"
    notes: list = field(default_factory=list)


@dataclass
class SystemRAM:
    total_mb: float
    available_mb: float
    used_mb: float
    shmem_mb: float          # Shmem de /proc/meminfo -- real shared memory em RAM
    shm_is_tmpfs: bool       # /dev/shm e mount tmpfs separado?
    shm_tmpfs_size_mb: float # tamanho do tmpfs se for mount real, 0 caso contrario
    swap_used_mb: float


def get_system_ram() -> SystemRAM:
    meminfo = {}
    try:
        with open("/proc/meminfo") as f:
            for line in f:
                parts = line.split()
                if len(parts) >= 2:
                    meminfo[parts[0].rstrip(":")] = int(parts[1])
    except FileNotFoundError:
        return SystemRAM(0, 0, 0, 0, False, 0, 0)

    total     = meminfo.get("MemTotal", 0) / 1024
    available = meminfo.get("MemAvailable", 0) / 1024
    used      = total - available
    shmem     = meminfo.get("Shmem", 0) / 1024
    swap_used = (meminfo.get("SwapTotal", 0) - meminfo.get("SwapFree", 0)) / 1024

    # Verificar se /dev/shm e mount tmpfs real (nao apenas pasta no disco)
    shm_is_tmpfs = False
    shm_size_mb = 0
    try:
        result = subprocess.run(
            ["findmnt", "-n", "-o", "FSTYPE,SIZE", "/dev/shm"],
            capture_output=True, text=True, timeout=3
        )
        if result.returncode == 0 and "tmpfs" in result.stdout:
            shm_is_tmpfs = True
            # Parsear tamanho (ex: "3.4G" ou "512M")
            parts = result.stdout.strip().split()
            if len(parts) >= 2:
                size_str = parts[1].upper()
                try:
                    if size_str.endswith("G"):
                        shm_size_mb = float(size_str[:-1]) * 1024
                    elif size_str.endswith("M"):
                        shm_size_mb = float(size_str[:-1])
                    elif size_str.endswith("K"):
                        shm_size_mb = float(size_str[:-1]) / 1024
                except ValueError:
                    pass
        # Se findmnt nao retornou, /dev/shm nao e mount separado
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass

    return SystemRAM(
        total_mb=round(total, 1),
        available_mb=round(available, 1),
        used_mb=round(used, 1),
        shmem_mb=round(shmem, 1),
        shm_is_tmpfs=shm_is_tmpfs,
        shm_tmpfs_size_mb=round(shm_size_mb, 1),
        swap_used_mb=round(swap_used, 1),
    )


def dir_size_mb(path: Path, exclude=None) -> float:
    exclude = set(exclude or [])
    total = 0
    try:
        for entry in path.rglob("*"):
            if any(p in entry.parts for p in exclude):
                continue
            if entry.is_file():
                try:
                    total += entry.stat().st_size
                except OSError:
                    pass
    except PermissionError:
        pass
    return total / MB


def detect_app_type(path: Path) -> str:
    if (path / "package.json").exists():
        try:
            pkg = json.loads((path / "package.json").read_text())
            scripts = pkg.get("scripts", {})
            if any("tsx" in str(v) for v in scripts.values()):
                return "tsx"
            if any("vite" in str(v) for v in scripts.values()):
                return "vite"
        except Exception:
            pass
        return "node"
    if (path / "mcp_server.py").exists() or (path / "requirements.txt").exists():
        return "fastapi" if (path / "mcp_server.py").exists() else "python"
    return "unknown"


def estimate_snapshot_mb(path: Path, interval_s: int) -> float:
    data_mb = dir_size_mb(path, exclude=["node_modules", ".git", "dist", "__pycache__"])
    state_mb = data_mb * 2
    wal_mb = state_mb * 0.1
    return round((state_mb + wal_mb) * 1.5, 1)


def profile_app(path_str: str, interval_s: int) -> AppProfile:
    p = Path(path_str).expanduser().resolve()
    profile = AppProfile(name=p.name, path=str(p))

    if not p.exists():
        profile.notes.append("AVISO: diretorio nao encontrado: " + str(p))
        return profile

    profile.app_type = detect_app_type(p)

    nm = p / "node_modules"
    if nm.exists():
        profile.deps_mb = round(dir_size_mb(nm), 1)

    profile.disk_mb = round(
        dir_size_mb(p, exclude=["node_modules", ".venv", ".git", "dist", "__pycache__"]), 1
    )

    overhead_mb, desc = EXEC_OVERHEAD.get(profile.app_type, (100, "processo generico"))
    profile.exec_overhead_mb = overhead_mb
    profile.notes.append("Runtime: " + profile.app_type + " (+" + str(overhead_mb) + "MB -- " + desc + ")")

    profile.snapshot_mb = estimate_snapshot_mb(p, interval_s)

    profile.ramdisk_mb = round(
        profile.deps_mb * 0.3 + profile.snapshot_mb, 1
    )
    profile.total_ram_mb = round(
        profile.exec_overhead_mb + profile.deps_mb * 0.5 + profile.snapshot_mb, 1
    )
    return profile


def print_report(ram: SystemRAM, apps: list, interval_s: int):
    W = 60
    print("")
    print("=" * W)
    print("RAM & RAMDISK CALCULATOR -- GOS3 / Prevayler-style")
    print("=" * W)

    print("\n[SISTEMA]")
    print("  RAM total:         %8.1f MB" % ram.total_mb)
    print("  RAM disponivel:    %8.1f MB" % ram.available_mb)
    print("  RAM em uso:        %8.1f MB" % ram.used_mb)
    print("  Swap em uso:       %8.1f MB" % ram.swap_used_mb)
    print("  Shmem (/proc):     %8.1f MB  <- shared memory REAL em RAM" % ram.shmem_mb)

    if ram.shm_is_tmpfs:
        print("  /dev/shm:          %8.1f MB  [tmpfs mount real]" % ram.shm_tmpfs_size_mb)
    else:
        print("  /dev/shm:          NOT A SEPARATE TMPFS MOUNT")
        print("  Ramdisk disponivel:      0 MB  <- usar /dev/shm seria disco, nao RAM")

    print("\n[APPS]")
    print("  %-20s %6s %9s %7s %8s" % ("App", "Deps", "Snapshot", "RAM", "Ramdisk"))
    print("  " + "-"*20 + " " + "-"*6 + " " + "-"*9 + " " + "-"*7 + " " + "-"*8)
    for a in apps:
        print("  %-20s %5.0fM %8.0fM %6.0fM %7.0fM" % (
            a.name, a.deps_mb, a.snapshot_mb, a.total_ram_mb, a.ramdisk_mb
        ))
        for note in a.notes:
            print("    -> " + note)

    total_ram = sum(a.total_ram_mb for a in apps)
    total_rd  = sum(a.ramdisk_mb for a in apps)
    safety    = total_rd * 0.25
    needed    = total_rd + safety
    feasible  = ram.available_mb >= (total_ram + safety)
    state_mb  = sum(a.snapshot_mb for a in apps)
    wal_mb    = state_mb * 0.1

    print("\n[RESUMO]")
    print("  RAM necessaria total:    %8.1f MB" % total_ram)
    print("  Ramdisk necessario:      %8.1f MB" % needed)
    print("  RAM disponivel:          %8.1f MB" % ram.available_mb)
    print("  Viavelidade:             " + ("[OK] SIM" if feasible else "[FAIL] NAO -- deficit %.0fMB" % (total_ram + safety - ram.available_mb)))

    print("\n[PREVAYLER SNAPSHOT]")
    print("  State serializado:       %8.1f MB" % state_mb)
    print("  WAL por intervalo:       %8.1f MB" % wal_mb)
    print("  Intervalo:               %8ds (%dmin)" % (interval_s, interval_s // 60))

    if ram.shm_is_tmpfs:
        tmpfs_cmd = "mount -t tmpfs -o size=%dM tmpfs /dev/shm/vortex_agents" % int(needed + 100)
        print("\n[TMPFS] Comando recomendado:")
        print("  mkdir -p /dev/shm/vortex_agents")
        print("  " + tmpfs_cmd)
    else:
        print("\n[TMPFS] /dev/shm nao e tmpfs separado neste ambiente.")
        print("  Para ramdisk real, montar explicitamente:")
        print("  mount -t tmpfs -o size=%dM tmpfs /mnt/ramdisk" % int(needed + 100))
        print("  (requer root -- em proot pode nao funcionar)")

    if ram.swap_used_mb > 0:
        print("\n[WARN] Swap em uso: %.0fMB -- sistema sob pressao de memoria." % ram.swap_used_mb)
        print("  Nao iniciar tsx + mcp_server simultaneamente sem liberar RAM primeiro.")

    print("")


def main():
    ap = argparse.ArgumentParser(description="Budget de RAM e ramdisk para apps GOS3")
    ap.add_argument("--apps", nargs="+",
                    default=["~/xAI", "~/zAI", "~/vortex"])
    ap.add_argument("--snapshot-interval", type=int, default=300)
    args = ap.parse_args()

    ram = get_system_ram()
    apps = [profile_app(p, args.snapshot_interval) for p in args.apps]
    print_report(ram, apps, args.snapshot_interval)


if __name__ == "__main__":
    main()
