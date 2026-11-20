"""Compatibility import for the TVAPP selection rules."""
if __package__:
    from .tvapp.tvapp_selection import LIMIT, REPOSITORY, load_overrides, select_overrides
else:
    from tvapp.tvapp_selection import LIMIT, REPOSITORY, load_overrides, select_overrides
