import os
import time
import signal
import unicornhat as unicorn
import fonts

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
start_time = time.time()

def loop():
    global start
    start = 1
    try:
        if os.path.isfile('/src/on.txt'):
            while start:
                print("Start")
                unicorn.clear()
                time.sleep(2)
                elap=(time.time() - start_time)
                num=int(round(elap/60))
                print(num)
                if num < 10:
                    # for i in range(8):
                    #     for cell in range(4):
                    #         if fonts.numbers[0][i][cell]:
                    #             unicorn.set_pixel(cell,i,r,g,b)
                    for i in range(8):
                        for cell in range(4,8):
                            if fonts.numbers[num][i][cell-4]:
                                unicorn.set_pixel(cell,i,r,g,b)
                    unicorn.show()
                    time.sleep(2)
                    unicorn.clear()
                else:
                    print('Number over 10')
                    splitNum=list(map(int,str(num)))
                    for i in range(8):
                        for cell in range(4):
                            if fonts.numbers[splitNum[0]][i][cell]:
                                unicorn.set_pixel(cell,i,r,g,b)
                    for i in range(8):
                        for cell in range(4,8):
                            if fonts.numbers[splitNum[1]][i][cell-4]:
                                unicorn.set_pixel(cell,i,r,g,b)
                    unicorn.show()
                    time.sleep(2)
                    unicorn.clear()


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
                time.sleep(0.5)
                for i in range(3):
                    unicorn.set_all(r,g,b)
                    unicorn.show()
                    time.sleep(0.2)
                    unicorn.clear()
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