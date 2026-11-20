import faulthandler,os,sys
if os.path.basename(sys.argv[0]) == 'launcher.py':
    print('macOS launcher diagnostic PID',os.getpid(),file=sys.stderr,flush=True)
    faulthandler.dump_traceback_later(15, repeat=True)
