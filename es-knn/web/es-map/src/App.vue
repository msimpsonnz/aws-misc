<template>
  <div id="app">
    <div>
<select name="Price From:" v-model="selectParams.priceLow">
  <option :value="price" v-for="(price, index) in searchParams.price" :key="`price-${index}`">
    Minimum Price: {{ price }}
  </option>
</select>
    </div>
    <div>
<select v-model="selectParams.priceHigh">
  <option :value="price" v-for="(price, index) in searchParams.price" :key="`price-${index}`">
    Maximum Price: {{ price }}
  </option>
</select>
    </div>
    <div>
      <input type="text" v-model="selectParams.lat" value="number">
    </div>
        <div>
      <input type="text" v-model="selectParams.lng" value="number">
    </div>
    <div>
    <input type="text" v-model="params" placeholder="Custom Search">
    </div>
    <HereMap  :center="center" :params="params" :selectParams="selectParams"/>
  </div>
</template>

<script>
import HereMap from './components/HereMap'
export default {
  name: 'app',
  components: {
    HereMap
    // Remove the HelloWorld.vue 
  },
  data() {
    return {
      params: '',
      selectParams: {
        priceLow: 0,
        priceHigh: 0,
        lat: -36.896852899140384, 
        lng: 174.8112767589163
      },
      searchParams: {
        price: [ 800000, 1000000, 1200000, 1400000, 1600000, 1800000]
      },
      center:{ 
        lat: -36.89716177992839, 
        lng: 174.81127676005582,
      },
    }
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
