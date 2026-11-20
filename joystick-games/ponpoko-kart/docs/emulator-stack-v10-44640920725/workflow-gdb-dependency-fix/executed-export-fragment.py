files={}
for path in sorted(out.rglob('*')):
    assert not path.is_symlink()
    if path.is_file():
        assert path.stat().st_size<100_000_000
        files[path.relative_to(out).as_posix()]=record(path)
