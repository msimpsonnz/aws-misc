const CreateTodo = `mutation createTodo($note: String!) {
  createTodo(input: {note: $note}) {
    id
    note
  }
}`;

const ListTodos = `query {
  listTodos {
    items {
      id
      note
      done
    }
  }
}`;

const GetTodo = `query getTodo {
  listTodos(filter: {
    done: {
      eq: true
    }
  }) {
    items {
      id
      note
      done
      scan
    }
  }
}`;

const UpdateTodo = `mutation updateTodo($id: ID!, $note: String, $done: Boolean) {
  updateTodo(input: {id: $id, note: $note, done: $done}) {
    id
    note
    done
  }
}`;

const DeleteTodo = `mutation DeleteTodo($id: ID!) {
  deleteTodo(input: {id: $id}) {
    id
  }
}
`

export {
  CreateTodo,
  ListTodos,
  GetTodo,
  UpdateTodo,
  DeleteTodo
}
