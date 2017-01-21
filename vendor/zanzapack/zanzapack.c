/*
    Copyright 2005,2006 Luigi Auriemma

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307 USA

    http://www.gnu.org/licenses/gpl.txt
*/

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/stat.h>

#ifdef WIN32
    #include <direct.h>

    typedef unsigned char   u_char;
    typedef unsigned int   u_int;
#else
    #include <unistd.h>
#endif



#define VER         "0.1"
#define BUFFSZ      32768
#define NAMESZ      512
#define FMT32       "%08x"

#define FGETS       if(!fgets(buff, sizeof(buff) - 1, fdl)) read_err(); \
                    for(p = buff; *p > '\r'; p++); \
                    *p = 0;



void unpack(u_char *input, u_char *outdir, u_char *list);
void pack(u_char *list, u_char *indir, u_char *output);
void getfile(FILE *fdin, u_char *fname, u_int size);
void putfile(u_char *fname, FILE *fdout, u_int size);
u_char *create_dir(u_char *name);
void read_err(void);
void write_err(void);
void std_err(void);



int main(int argc, char *argv[]) {
    setbuf(stdout, NULL);

    fputs("\n"
        "Zanzarah PAK files unpacker/repacker "VER"\n"
        "by Luigi Auriemma\n"
        "e-mail: aluigi@autistici.org\n"
        "web:    aluigi.org\n"
        "\n", stdout);

    if(argc < 5) {
        printf("\n"
            "Usage: %s <command>\n"
            "\n"
            "Commands:\n"
            " u <input.PAK> <output_directory> <output_listfile>\n"
            " p <input_listfile> <input_directory> <output.PAK>\n"
            "\n"
            "Explanation:\n"
            " u must be used to unpack a PAK file and you must specify just the filename,\n"
            " the output directory in which will be extracted the files and the name of a\n"
            " text file that will contain the names of these files and other informations\n"
            " for rebuilding the PAK file later\n"
            "\n"
            " p instead is used to rebuild the PAK file, you must specify the listfile\n"
            " previously created, the directory in which are located all the extracted\n"
            " files and the name of the PAK file you want to create.\n"
            "\n"
            " Remember that if the files already exist they will be overwritten.\n"
            "\n", argv[0]);
        exit(1);
    }

    switch(argv[1][0]) {
        case 'u': unpack(argv[2], argv[3], argv[4]); break;
        case 'p': pack(argv[2], argv[3], argv[4]); break;
        default: {
            fputs("\nError: you must choose the option u or p, check the details at runtime\n\n", stdout);
            exit(1);
        }
    }

    fputs("\n- Finished\n", stdout);
    return(0);
}



void unpack(u_char *input, u_char *outdir, u_char *list) {
    FILE    *fd,
            *fdl;
    u_int  i,
            id,
            attr,
            num,
            name,
            off,
            size,
            curroff,
            headsize;
    u_char  buff[NAMESZ],   // bof? not important
            *p;

    printf("- open input PAK file:       %s\n", input);
    fd = fopen(input, "rb");
    if(!fd) std_err();

    printf("- create output listfile:    %s\n", list);
    fdl = fopen(list, "wb");
    if(!fdl) std_err();

    printf("- enter in output directory: %s\n", outdir);
    if(chdir(outdir) < 0) std_err();

    if(fread((void *)&id,  4, 1, fd) != 1) read_err();
    printf("- ID:                        0x%08x\n", id);
    fprintf(fdl, FMT32 " // ID\n", id);

    if(fread((void *)&num, 4, 1, fd) != 1) read_err();
    printf("- Number of files:           0x%08x\n", num);
    fprintf(fdl, FMT32 " // files\n", num);

    for(i = 0; i < num; i++) {
        if(fread((void *)&name, 4, 1, fd) != 1) read_err();
        if(fseek(fd, name + 4 + 4, SEEK_CUR) < 0) std_err();
    }
    headsize = ftell(fd);
    printf("- Header size:               0x%08x\n", headsize);
    fprintf(fdl, FMT32 " // header size\n", headsize);

    fseek(fd, 8, SEEK_SET);

    fputs("\n"
        "Filesize     Offset   Filename\n"
        "------------------------------------------------------------------------------\n", stdout);

    for(i = 0; i < num; i++) {
        if(fread((void *)&name, 4, 1, fd) != 1) read_err();
        if(fread(buff, name, 1, fd) != 1) read_err();
        buff[name] = 0;
        if(fread((void *)&off,  4, 1, fd) != 1) read_err();
        if(fread((void *)&size, 4, 1, fd) != 1) read_err();

        off += headsize;
        size -= 12;      // remove attr
        printf("%-12u %08x %s\n", size, off, buff);

        curroff = ftell(fd);
        if(fseek(fd, off, SEEK_SET) < 0) std_err();

        if(fread((void *)&attr, 4, 1, fd) != 1) read_err();
        fprintf(fdl, FMT32 " %s\n", attr, buff);

        p = create_dir(buff);
        getfile(fd, p, size);

        if(fseek(fd, curroff, SEEK_SET) < 0) std_err();
    }

    fclose(fd);
    fclose(fdl);
}



void pack(u_char *list, u_char *indir, u_char *output) {
    struct  stat    xstat;
    FILE    *fd,
            *fdl;
    u_int  id,
            attr,
            num,
            name,
            off,
            size,
            curroff,
            headsize;
    u_char  buff[NAMESZ],   // bof? not important
            *fname,
            *p;

    printf("- open input listfile:       %s\n", list);
    fdl = fopen(list, "rb");
    if(!fdl) std_err();

    printf("- create output PAK file:    %s\n", output);
    fd = fopen(output, "wb");
    if(!fd) std_err();

    printf("- enter in input directory:  %s\n", indir);
    if(chdir(indir) < 0) std_err();

    FGETS;
    sscanf(buff, FMT32, &id);
    printf("- ID:                        0x%08x\n", id);
    if(fwrite((void *)&id, 4, 1, fd) != 1) write_err();

    FGETS;
    sscanf(buff, FMT32, &num);
    printf("- Number of files:           0x%08x\n", num);
    if(fwrite((void *)&num, 4, 1, fd) != 1) write_err();

    FGETS;
    sscanf(buff, FMT32, &headsize);
    printf("- Header size:               0x%08x\n", headsize);

    fputs("\n"
        "Filesize     Offset   Filename\n"
        "------------------------------------------------------------------------------\n", stdout);

    off = headsize;
    while(num--) {
        FGETS;

        sscanf(buff, FMT32, &attr);
        for(p = buff; *p && (*p != ' '); p++);
        fname = p + 1;      // fname = strchr(buff, ' ');

        name = strlen(fname);
        if(fwrite((void *)&name, 4, 1, fd) != 1) write_err();

        printf("                      %s\r", fname);
        if(fwrite(fname, name, 1, fd) != 1) write_err();

#ifndef WIN32
        for(p = fname; *p; p++) {
            if(*p == '\\') *p = '/';
        }
#endif
        if(!memcmp(fname, "..", 2)) fname += 3;

        off -= headsize;
        if(fwrite((void *)&off, 4, 1, fd) != 1) write_err();

        if(stat(fname, &xstat) < 0) std_err();
        size = xstat.st_size;
        printf("%-12lu ", xstat.st_size);
        size += 4;      // add attr
        if(fwrite((void *)&size, 4, 1, fd) != 1) write_err();
        size -= 4;

        printf("%08x\n", off);
        off += headsize;
        curroff = ftell(fd);

        if(fseek(fd, off, SEEK_SET) < 0) std_err();

        if(fwrite((void *)&attr, 4, 1, fd) != 1) write_err();
        putfile(fname, fd, size);

        off = ftell(fd);
        if(fseek(fd, curroff, SEEK_SET) < 0) std_err();
    }

    fclose(fd);
    fclose(fdl);
}



void getfile(FILE *fdin, u_char *fname, u_int size) {
    FILE    *fdout;
    int     len;
    u_char  buff[BUFFSZ];

    fdout = fopen(fname, "wb");
    if(!fdout) std_err();

    for(len = sizeof(buff) - 1; size; size -= len) {
        if(len > size) len = size;
        if(fread(buff, len, 1, fdin) != 1) read_err();
        if(fwrite(buff, len, 1, fdout) != 1) write_err();
    }

    fclose(fdout);
}



void putfile(u_char *fname, FILE *fdout, u_int size) {
    FILE    *fdin;
    int     len;
    u_char  buff[BUFFSZ];

    fdin = fopen(fname, "rb");
    if(!fdin) std_err();

    for(len = sizeof(buff) - 1; size; size -= len) {
        if(len > size) len = size;
        if(fread(buff, len, 1, fdin) != 1) read_err();
        if(fwrite(buff, len, 1, fdout) != 1) write_err();
    }

    fclose(fdin);
}



u_char *create_dir(u_char *name) {
    u_char  *stri,
            *strf;

    if(!memcmp(name, "..\\", 3)) name += 3;
    stri = name;
    while((strf = strchr(stri, '\\'))) {
        *strf = 0;
        stri = strf + 1;

#ifdef WIN32
        mkdir(name);
        *strf = '\\';
#else
        mkdir(name, 0755);
        *strf = '/';
#endif
    }
    return(name);
}



void read_err(void) {
    fputs("\nError: error during the reading of the input file\n\n", stdout);
    exit(1);
}



void write_err(void) {
    fputs("\nError: error during the writing of the output file, probably you have finished your disk space\n\n", stdout);
    exit(1);
}



void std_err(void) {
    perror("\nError");
    exit(1);
}
