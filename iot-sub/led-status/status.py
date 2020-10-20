import os
import json
import time
import signal
import socket
import sys
import unicornhat as unicorn
import fonts

unicorn.set_layout(unicorn.HAT)
unicorn.rotation(180)
unicorn.brightness(0.5)

r = int(sys.argv[1])
g = int(sys.argv[2])
b = int(sys.argv[3])

row0 = [ 0, 1, 6, 7]
row1 = [ 0, 1, 2, 5, 6, 7]
row2 = [ 1, 2, 3, 4, 5, 6]
row3 = [ 2, 3, 4, 5]
matrix = [row0,row1,row2,row3,row3,row2,row1,row0]

start = 0
start_time = time.time()

def loop():
    global start
    start = 1
    try:
        if os.path.isfile('/src/on.txt'):
            while start:
                # get_lock('iotstatus')
                #print("Start")
                unicorn.clear()
                time.sleep(2)
                elap=(time.time() - start_time)
                num=int(round(elap/60))
                print(num)
                if num < 10:
                    for i in range(8):
                        for cell in range(4,8):
                            if fonts.numbers[num][i][cell-4]:
                                rgb=read_rgb()
                                unicorn.set_pixel(cell,i,rgb['r'],rgb['g'],rgb['b'])
                    unicorn.show()
                    time.sleep(2)
                    unicorn.clear()
                else:
                    #print('Number over 10')
                    splitNum=list(map(int,str(num)))
                    for i in range(8):
                        for cell in range(4):
                            if fonts.numbers[splitNum[0]][i][cell]:
                                rgb=read_rgb()
                                unicorn.set_pixel(cell,i,rgb['r'],rgb['g'],rgb['b'])
                    for i in range(8):
                        for cell in range(4,8):
                            if fonts.numbers[splitNum[1]][i][cell-4]:
                                rgb=read_rgb()
                                unicorn.set_pixel(cell,i,rgb['r'],rgb['g'],rgb['b'])
                    unicorn.show()
                    time.sleep(2)
                    unicorn.clear()


                for i in range(8):
                    for cell in matrix[i]:
                        rgb=read_rgb()
                        unicorn.set_pixel(cell,i,rgb['r'],rgb['g'],rgb['b'])
                        unicorn.show()
                        time.sleep(0.01)
                time.sleep(2)

                for i in range(8):
                    for cell in matrix[i]:
                        rgb=read_rgb()
                        unicorn.set_pixel(cell,i,rgb['r'],rgb['g'],rgb['b'])
                        unicorn.show()
                        time.sleep(0.01)
                time.sleep(0.5)
                for i in range(3):
                    rgb=read_rgb()
                    unicorn.set_all(rgb['r'],rgb['g'],rgb['b'])
                    unicorn.show()
                    time.sleep(0.2)
                    unicorn.clear()
                time.sleep(2)
        else:
            exit()

    except KeyboardInterrupt:
        unicorn.off()

def read_rgb():
    with open('/src/rgb.json') as json_file:
        data = json.load(json_file)
    return data

def write_rgb(r_value = 0, g_value = 255, b_value = 0):
    data = {
        'r': r_value,
        'g': g_value,
        'b': b_value,
    }

    with open('/src/rgb.json', 'w') as outfile:
        json.dump(data, outfile)

# def get_lock(process_name):
#     get_lock._lock_socket = socket.socket(socket.AF_UNIX, socket.SOCK_DGRAM)
#     try:
#         get_lock._lock_socket.bind('\0' + process_name)
#         print('Script lock')
#     except socket.error:
#         print('Error: script running')
#         sys.exit()


def cleanup (signumber, stackframe):
    global start
    start = 0

signal.signal(signal.SIGABRT, cleanup)
signal.signal(signal.SIGTERM, cleanup)
signal.signal(signal.SIGQUIT, cleanup)
write_rgb(r,g,b)
loop()