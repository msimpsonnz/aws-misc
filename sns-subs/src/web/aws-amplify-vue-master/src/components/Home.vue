<template>
  <div class="form">
    <div class="inputRow">
        <label class="inputLabel">Message</label>
        <input
          class="input" v-model="userData.msg"
        />
    </div>
    <div class="actionRow">
      <button class="action" v-on:click="send">Send</button>
    </div>
  </div>
</template>

<script>
import Amplify, { API } from 'aws-amplify';

export default {
  name: 'Home',
  data () {
    return {
      userData: {
          msg: ''
      }
    }
  },
  methods: {
    send() {
        let apiName = 'snsPub';
        let path = '/msg'; 
        let myInit = { // OPTIONAL
            headers: {}, // OPTIONAL
            response: true, // OPTIONAL (return the entire Axios response object instead of only response.data)
            queryStringParameters: {  // OPTIONAL
                name: 'param'
            },
            body: { body: this.userData.msg }
        }
        API.post(apiName, path, myInit).then(response => {
            // Add your code here
        }).catch(error => {
            console.log(error.response)
        });
        this.userData.msg = ''

    }
  }
}
</script>