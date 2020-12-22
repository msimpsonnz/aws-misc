import random
import numpy as np

def create_random_point(x0,y0,distance):
    """
            Utility method for simulation of the points
    """   
    r = distance/ 111300
    u = np.random.uniform(0,1)
    v = np.random.uniform(0,1)
    w = r * np.sqrt(u)
    t = 2 * np.pi * v
    x = w * np.cos(t)
    x1 = x / np.cos(y0)
    y = w * np.sin(t)
    return (x0+x1, y0 +y)

latitude1,longitude1 = -36.896852899140384, 174.8112767589163

priceRange = [1000000, 1200000, 1400000, 1600000]
bedRange = [3,4]
bathRange = [1,2]


result=[]

for i in range(1,20):
    x,y = create_random_point(latitude1,longitude1 ,500 )
    price = random.choice(priceRange)
    priceLow = price - 200000
    priceHigh = price + 200000
    bed = random.choice(bedRange)
    bath = random.choice(bathRange)
    sqm = random.randint(400, 800)
    result.append([1, priceLow, priceHigh, price, bed, bath, sqm, x, y])

for target_list in result:
    print(target_list)