<template>
  <div>
    <p class="error">{{ error }}</p>

    <h4 class="h4">
           <a-note
        v-for="todo in todos"
        :key="todo.id"
        :todo="todo"
        :theme="theme"
      />
    </h4>
    <qrcode-stream @decode="onDecode" @init="onInit" />
        <h4>
      Shipment Id: {{id}}
    </h4>
            <h4>
      QR: {{result}}
    </h4>
  </div>
</template>

<script>
import { QrcodeStream } from 'vue-qrcode-reader'

import Vue from 'vue'
import { Logger } from 'aws-amplify'
import { JS } from 'fsts'

import AmplifyStore from '../../store/store'

import  { GetTodo, UpdateTodo }  from './persist/graphqlActions';

import NotesTheme from '../NotesTheme'
import { scrypt } from 'crypto';
// import Shipment from './Shipment'

// Vue.component('a-scan', Shipment)

export default {

  components: { QrcodeStream },

  data () {
    return {
      result: '',
      error: '',
      theme: NotesTheme || {},
      note: '',
      id: '',
      todos: [],
      filter: 'all',
      logger: {},
      actions: {
        get: GetTodo,
        update: UpdateTodo
      }
    }
  },
    created() {
    this.logger = new this.$Amplify.Logger('NOTES_component')
    this.get();
  },
  computed: {
    userId: function() { return AmplifyStore.state.userId }
  },
  methods: {
    get() {
      this.$Amplify.API.graphql(this.$Amplify.graphqlOperation(this.actions.get, {}))
      .then((res) => {
        this.todos = res.data.listTodos.items;
        this.id = this.todos[0].id
        this.logger.info(`Todos successfully listed`, res)
      })
      .catch((e) => {
        this.logger.error(`Error listing Todos`, e)
      });
    },
    scan() {
      this.logger = new this.$Amplify.Logger(`Id: ${this.id}`)
      this.logger = new this.$Amplify.Logger(`Result: ${this.result}`)
      this.$Amplify.API.graphql(this.$Amplify.graphqlOperation(this.actions.update, {id: this.id, scan: this.result}))
        .catch((e) => {
          this.logger.error(`Error toggling Todo ${todo.id} done status`, e)
        })
    },
    
    onDecode (result) {
      this.result = result
      this.logger.info(`QR result: ${this.result}`)
      this.logger = new this.$Amplify.Logger(`Result: ${this.result}`)
      this.scan()
      this.$router.push('/notes')
    },

    async onInit (promise) {
      try {
        await promise
      } catch (error) {
        if (error.name === 'NotAllowedError') {
          this.error = "ERROR: you need to grant camera access permisson"
        } else if (error.name === 'NotFoundError') {
          this.error = "ERROR: no camera on this device"
        } else if (error.name === 'NotSupportedError') {
          this.error = "ERROR: secure context required (HTTPS, localhost)"
        } else if (error.name === 'NotReadableError') {
          this.error = "ERROR: is the camera already in use?"
        } else if (error.name === 'OverconstrainedError') {
          this.error = "ERROR: installed cameras are not suitable"
        } else if (error.name === 'StreamApiNotSupportedError') {
          this.error = "ERROR: Stream API is not supported in this browser"
        }
      }
    }
  }
}
</script>

<style scoped>
.error {
  font-weight: bold;
  color: red;
}
</style>
