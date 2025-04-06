const API_URL = "http://localhost:4000/graphql";

let totalScore = 0;

function updateScoreDisplay() {
  document.getElementById("score").textContent = `Today's Score: ${totalScore}`;
}


const COIN_VALUES = {
    HIGH: 50,
    MEDIUM: 30,
    LOW: 10,
  };
  

async function fetchGraphQL(query, variables = {}) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables })
  });
  const data = await response.json();
  return data.data;
}

async function getTodos() {
  const completedVal = document.getElementById("completed-filter").value;
  const priorityVal = document.getElementById("priority-filter").value;

  const variables = {};
  if (completedVal !== "all") variables.completed = completedVal === "true";
  if (priorityVal !== "all") variables.priority = priorityVal;

  const query = `
    query GetTodos($completed: Boolean, $priority: Priority) {
      getTodos(completed: $completed, priority: $priority) {
        id
        task
        completed
        priority
      }
    }
  `;
  const data = await fetchGraphQL(query, variables);
  renderTodos(data.getTodos);
}

async function addTodo(task, priority) {
  const mutation = `
    mutation AddTodo($task: String!, $priority: Priority!) {
      addTodo(task: $task, priority: $priority) {
        id
      }
    }
  `;
  await fetchGraphQL(mutation, { task, priority });
  getTodos();
}

async function toggleTodo(id) {
    // Get the current state of this todo
    const query = `
      query {
        getTodos {
          id
          task
          completed
          priority
        }
      }
    `;
    const data = await fetchGraphQL(query);
    const todo = data.getTodos.find((t) => t.id === id);
  
    const wasCompleted = todo.completed;
  
    const mutation = `
      mutation ToggleTodo($id: ID!) {
        toggleTodo(id: $id) {
          id
          completed
          priority
        }
      }
    `;
    const result = await fetchGraphQL(mutation, { id });
  
    // Only award coins if we're marking it as completed now
    if (!wasCompleted && result.toggleTodo.completed) {
      const priority = result.toggleTodo.priority;
      totalScore += COIN_VALUES[priority];
      updateScoreDisplay();
    }
  
    getTodos();
  }
  

async function deleteTodo(id) {
  const mutation = `
    mutation DeleteTodo($id: ID!) {
      deleteTodo(id: $id)
    }
  `;
  await fetchGraphQL(mutation, { id });
  getTodos();
}

function renderTodos(todos) {
    const list = document.getElementById("todo-list");
    list.innerHTML = "";
  
    todos.forEach((todo) => {
      const div = document.createElement("div");
      div.className = "todo";
      if (todo.completed) div.classList.add("completed");
  
      // Set points and class based on priority
      let points = 0;
      let badgeClass = "";
  
      if (todo.priority === "HIGH") {
        points = 50;
        badgeClass = "high-priority";
      } else if (todo.priority === "MEDIUM") {
        points = 30;
        badgeClass = "medium-priority";
      } else if (todo.priority === "LOW") {
        points = 10;
        badgeClass = "low-priority";
      }
  
      div.innerHTML = `
        <span class="points-badge ${badgeClass}">${points}</span>
        <span onclick="toggleTodo('${todo.id}')">${todo.task}</span>
        <button id="close" onclick="deleteTodo('${todo.id}')">&#x2715</button>
      `;
  
      list.appendChild(div);
    });
  }
  
  

document.getElementById("newDayBtn").addEventListener("click", () => {
    // Reset coins to 0
    totalScore = 0;
    document.getElementById("scoreDisplay").textContent = `🪙 Coins: ${totalScore}`;
  
    // Clear todos visually
    document.getElementById("todoList").innerHTML = '';
  
    // (Optional) Reset in-memory list too (frontend only)
    // Or, you could re-fetch from GraphQL to keep server state
    todos = [];
  
    // (Optional) Show a confirmation
    alert("✨ A new day has started! All tasks cleared.");
  });
  

document.getElementById("todo-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const task = document.getElementById("task").value;
  const priority = document.getElementById("priority").value;
  addTodo(task, priority);
  e.target.reset();
});

document.getElementById("completed-filter").addEventListener("change", getTodos);
document.getElementById("priority-filter").addEventListener("change", getTodos);

// Initial load
getTodos();

updateScoreDisplay();

