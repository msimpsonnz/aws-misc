/*
 * Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with
 * the License. A copy of the License is located at
 *
 *     http://aws.amazon.com/apache2.0/
 *
 * or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */

<template>
  <div class="container shifted">
    <h1 class="h1">
      AWS Amplify Vue Sample
    </h1>

    <div class="section">
  <div class="form">
        <label class="inputLabel">Submit your query here:</label>
        <input
          class="inputLabel"
          v-model="queryParam1"
          placeholder="ssss"
        />
                <input
          class="inputLabel"
          v-model="queryParam2"
        />
                <input
          class="inputLabel"
          v-model="queryParam3"
        />
        
        <label class="inputLimt">Number of queries:</label>
        <div>
                <input
          class="inputLimt"
          v-model="queryLimit"
        />
        </div>
      </div>
    </div>
    <div class="actionRow">
      <button class="action" v-on:click="send">Query</button>
    </div>
    <div class="result">
      <h2> Results </h2>
  {{ res }}
  </div>

    </div>
</template>


<script>
import Amplify, { API } from 'aws-amplify';
import { request } from 'http';

export default {
  name: 'Home',
  data () {
    return {
      res: null,
      queryLimit: '5',
      queryParam1: 'elb_name',
      queryParam2: 'request_port',
      queryParam3: 'request_ip'
    }
  },
  methods: {
    send() {
        let apiName = 'athenaProxy';
        let path = '/query';
        let myInit = {
          body: {
            column: [
              this.queryParam1,
              this.queryParam2,
              this.queryParam3
            ]
          },
          headers: {},
            response: true,
            queryStringParameters: {
              limit: this.queryLimit
            }
        }
        API.post(apiName, path, myInit).then(response => {
            //res = response
            console.log(response.data)
            this.res = response.data
        }).catch(error => {
            console.log("error")
            console.log(error.response)
        });

    }
  }
}
</script>