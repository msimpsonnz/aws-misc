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
      selected
      done
    }
  }
}`;

const UpdateTodo = `mutation updateTodo($id: ID!, $note: String, $done: Boolean) {
  updateTodo(input: {id: $id, note: $note, done: $done}) {
    id
    note
    selected
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
  UpdateTodo,
  DeleteTodo
}
