
#include <signal.h>
#include <setjmp.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <sys/resource.h>
static volatile sig_atomic_t go;
static sigjmp_buf saved;
static void ready(int n) {(void)n;go=1;}
static void handled(int n) {(void)n;siglongjmp(saved,1);}
__attribute__((noinline)) static void fault(const char *arg) {
 volatile const char *local=arg;(void)local;*(volatile int*)0=1;
}
int main(int argc,char **argv) {
 (void)argc;struct rlimit zero={0,0};setrlimit(RLIMIT_CORE,&zero);
 signal(SIGUSR1,ready);puts("ready");fflush(stdout);
 while(!go)usleep(1000);
 if(!strcmp(argv[1],"zero"))return 0;
 if(!strcmp(argv[1],"handled")){
  signal(SIGSEGV,handled);if(!sigsetjmp(saved,1))fault("PRIVATE_ARG");
  puts("handled");fflush(stdout);signal(SIGSEGV,SIG_DFL);
 }
 fault("PRIVATE_ARG");return 99;
}
