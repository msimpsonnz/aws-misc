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
  <div :style="theme.container">
    <h2 :style="theme.header">Confirmation</h2>
    <ul :style="theme.list">
      <a-note
        v-for="todo in todos"
        :key="todo.id"
        :todo="todo"
        :theme="theme"
      />
    </ul>
        <div>
      <button class="action">Confirm</button>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import { Logger } from 'aws-amplify'
import { JS } from 'fsts'

import AmplifyStore from '../../store/store'

import  { CreateTodo, ListTodos, UpdateTodo, DeleteTodo, GetTodo }  from './persist/graphqlActions';

import NotesTheme from '../NotesTheme'
import Note from './Note'

Vue.component('a-note', Note)

export default {
  name: 'Notes',
  data () {
    return {
      theme: NotesTheme || {},
      note: '',
      todos: [],
      filter: 'all',
      logger: {},
      actions: {
        get: GetTodo,
      },
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
        this.logger.info(`Todos successfully listed`, res)
      })
      .catch((e) => {
        this.logger.error(`Error listing Todos`, e)
      });
    }
  }
}
</script>
