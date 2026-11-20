#!/usr/bin/env python3
"""Compatibility entry point for tools/tvapp/verify-fork-tvapp.py."""
from runpy import run_module

if __name__ == '__main__':
    package = f'{__package__}.tvapp' if __package__ else 'tvapp'
    run_module(f'{package}.verify-fork-tvapp', run_name='__main__', alter_sys=True)
