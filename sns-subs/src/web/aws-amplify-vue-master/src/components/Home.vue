<template>
  <div class="form">
    <div class="inputRow">
        <label class="inputLabel">Message</label>
        <input class="input"/>
    </div>
    <div class="actionRow">
      <button class="action" v-on:click="save">Send</button>
    </div>
  </div>
</template>

<script>

import Amplify, { API } from 'aws-amplify';


let apiName = 'apie495ddea'; // replace this with your api name.
let path = '/msg'; //replace this with the path you have configured on your API
let myInit = {
    body: {'body': 'test from amplify'}, // replace this with attributes you need
    headers: {} // OPTIONAL
}




export default {
  name: 'Home',
  data () {
    return {
    }
  },
  methods: {
    save() {
      API.post(apiName, path, myInit).then(response => {
          // Add your code here
      }).catch(error => {
          console.log(error.response)
      });
    }
  }
}
</script>