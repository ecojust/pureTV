#!/usr/bin/env python3
"""Compatibility entry point for tools/tvapp/update-tvapp-oversized.py."""
from runpy import run_module

if __name__ == '__main__':
    package = f'{__package__}.tvapp' if __package__ else 'tvapp'
    run_module(f'{package}.update-tvapp-oversized', run_name='__main__', alter_sys=True)
