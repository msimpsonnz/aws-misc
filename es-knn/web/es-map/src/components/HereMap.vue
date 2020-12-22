
<template>
    <div id="map">
        <button v-on:click="refreshMap">Regen Map</button>
    <div id="mapContainer" style="height:600px;width:100%" ref="hereMap"></div>
  </div>
</template>

<script>
import API from '@aws-amplify/api';
import Amplify from 'aws-amplify';

Amplify.configure({
  API: {
    endpoints: [
      {
        name: 'MyAPIGatewayAPI',
        endpoint: 'https://n3qeywfd69.execute-api.ap-southeast-2.amazonaws.com',
      },
    ],
  },
});
export default {
  name: "HereMap",
  props: {
    selectParams: Object,  
    center: Object,
    params: String
  },
  data() {
    return {
        renderComponent: true,
        platform: null,
        apikey: "",
        search: null,
        map: null,
        ui: null,
        group: null,
    };
  },
  async created() { 
    this.platform = new window.H.service.Platform({
      apikey: this.apikey
      // "app_code": this.appCode,
      // 'useHTTPS': true,
      // 'useCIT': true
    });
  },
  async mounted() {
    // Initialize the platform object:
    const platform = new window.H.service.Platform({
      apikey: this.apikey
    });
    this.platform = platform;
    await this.get10()
    //this.initializeHereMap();
    // Initialize the platform object:           
    var pixelRatio = window.devicePixelRatio || 1;
    let defaultLayers = this.platform.createDefaultLayers({
        tileSize: pixelRatio === 1 ? 256 : 512,
        ppi: pixelRatio === 1 ? undefined : 320
    });
    const mapContainer = this.$refs.hereMap;
    const H = window.H;
    // Obtain the default map types from the platform object
    var maptypes = this.platform.createDefaultLayers();

    // Instantiate (and display) a map object:
    this.map = new H.Map(mapContainer, maptypes.vector.normal.map, {
    zoom: 14,
    center: this.center
    });
    let behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(this.map));
    this.ui = H.ui.UI.createDefault(this.map, defaultLayers);
    this.LoadMapLocations()
  },
  methods: {
    async get10() {
      const apiName = 'MyAPIGatewayAPI';
      const path = '/prod/property';
      const results = await API.get(apiName, path)
      //console.log(JSON.stringify(results))
      this.search = results.hits
    },
    async getKnn() {
        let req = this.params
        console.log(JSON.stringify(this.selectParams))
        if (this.params === "") {
            req = JSON.stringify([
                this.selectParams.priceLow,
                this.selectParams.priceHigh,
                this.selectParams.lat,
                this.selectParams.lng
                ])
        }
        console.log(req)
      const apiName = 'MyAPIGatewayAPI';
      const path = '/prod/property';
      const myInit = {
          body: {
            params: req
          },
      };
      //console.log(JSON.stringify(myInit))
      const results = await API.post(apiName, path, myInit);
      //console.log(JSON.stringify(results))
      this.search = []
      this.search = results.hits
    },
    async refreshMap() {
        await this.getKnn()
        this.LoadMapLocations()
    },
    AddMarkerToGroup(group, location) {                       
        //console.log(location);
        var marker = new H.map.Marker({ lat: location.Latitude, lng: location.Longitude });
        marker.setData(location.Data);
        group.addObject(marker);
    },
    addMarkersToMap(locations) {
        this.map.removeObjects(this.map.getObjects())
        var scale = window.devicePixelRatio;
        this.group = null
        let group = this.group                
        group = new H.map.Group();                
        this.map.addObject(group);
        var self = this;  
        var position;                             
        group.addEventListener('tap', function (evt) {                    
            position = evt.target.getGeometry();

            // event target is the marker itself, group is a parent event target
            // for all objects that it contains
            var bubble = new H.ui.InfoBubble(evt.target.getGeometry(), {
                // read custom data
                content: evt.target.getData()                       
            });
            self.ui.getBubbles().forEach(bub => 
            console.log(JSON.stringify(`Bubbles: ${bub}`)))
            self.ui.getBubbles().forEach(bub => self.ui.removeBubble(bub));
            // show info bubble                                       
            self.ui.addBubble(bubble);                    
        }, false);                

        var addmarker = this.AddMarkerToGroup;
        locations.forEach(function (location) {                    
            addmarker(group, location);
        });                                                        
    },
    LoadMapLocations(){
        let locations = []
        this.search.forEach(element => {
            const data = `
            <div><a>Price: ${element._source.price}</a></div>
            <div><a>[${element._source.knn_vector}]</a></div>
            `;
            const item = {
                Latitude: element._source.lat,
                Longitude: element._source.long,
                Data: data
            }
            locations.push(item)
        });             
        this.addMarkersToMap(locations);                                                             
    }
  }
};
</script>

<style scoped>
#map {
  width: 60vw;
  min-width: 360px;
  text-align: center;
  margin: 5% auto;
  background-color: #ccc;
}
</style>