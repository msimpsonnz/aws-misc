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
      <h2 class="h2">Sample QR Scanning</h2>
      <pre class="pre">
      Note: For iOS you must use Safari and allow access to the camera
      1. Use your mobile to vist this site
      2. Go to the Shipments Page
      3. Select one shipment and click next
      4. Scan the sample QR code
      5. This should take you to the confirmation page and have updated the shipment with the tracking id


      </pre>
    </div>

  <img :src="`public/qr-Track12345.png`" height="150px" width="150px">

    <div class="section">
      <h2 class="h2">AWS Amplify Links</h2>
      <a class="link" href="https://github.com/aws/aws-amplify">GitHub</a>
      <a class="link" href="https://aws-amplify.github.io/">Docs</a>
    </div>
  </div>
</template>

<script>

export default {
  name: 'Home',
  data () {
  return {
      publicPath: process.env.BASE_URL
    }
  }
}
</script>
