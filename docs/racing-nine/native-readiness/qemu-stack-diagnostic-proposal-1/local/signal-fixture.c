#define _GNU_SOURCE
#include <signal.h>
#include <setjmp.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>
static sigjmp_buf saved;
static void handled(int number) { (void)number; siglongjmp(saved,1); }
__attribute__((noinline)) static void actual_fault(const char *secret) { volatile const char *keep = secret; (void)keep; *(volatile int *)0 = 7; }
int main(int argc,char **argv) {
 const char *secret="DO_NOT_ARCHIVE_ARGUMENT_OR_LOCAL_SECRET";
 (void)argc; printf("ready\n"); fflush(stdout); usleep(500000);
 if(!strcmp(argv[1],"handled")) { signal(SIGSEGV,handled); if(!sigsetjmp(saved,1))actual_fault(secret); printf("handled\n");fflush(stdout);signal(SIGSEGV,SIG_DFL);usleep(100000); }
 if(!strcmp(argv[1],"timeout")) { usleep(1200000);printf("continued-after-detach\n");return 0; }
 actual_fault(secret); return 0;
}
