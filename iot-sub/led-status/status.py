import os
import time
import signal
import unicornhat as unicorn

unicorn.set_layout(unicorn.HAT)
unicorn.rotation(0)
unicorn.brightness(0.5)

r = 255
g = 0
b = 0

row0 = [ 0, 1, 6, 7]
row1 = [ 0, 1, 2, 5, 6, 7]
row2 = [ 1, 2, 3, 4, 5, 6]
row3 = [ 2, 3, 4, 5]
matrix = [row0,row1,row2,row3,row3,row2,row1,row0]


start = 0

def loop():
    global start
    start = 1
    try:
        if os.path.isfile('/src/on.txt'):
            while start:
                print("Start")
                for i in range(8):
                    for cell in matrix[i]:
                        unicorn.set_pixel(cell,i,r,g,b)
                        unicorn.show()
                        time.sleep(0.01)
                time.sleep(2)         
                for i in range(8):
                    for cell in matrix[i]:
                        unicorn.set_pixel(cell,i,0,g,b)
                        unicorn.show()
                        time.sleep(0.01)
                time.sleep(2)  
        else:
            exit()

    except KeyboardInterrupt:
        unicorn.off()

def cleanup (signumber, stackframe):
    global start
    start = 0

signal.signal(signal.SIGABRT, cleanup)
signal.signal(signal.SIGTERM, cleanup)
signal.signal(signal.SIGQUIT, cleanup)
loop()