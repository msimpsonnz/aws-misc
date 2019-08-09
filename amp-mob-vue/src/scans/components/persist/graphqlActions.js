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

const UpdateTodo = `mutation updateTodo($id: ID!, $scan: String) {
  updateTodo(input: {id: $id, scan: $scan}) {
    id
    scan
  }
}`;

export {
  GetTodo,
  UpdateTodo
}
