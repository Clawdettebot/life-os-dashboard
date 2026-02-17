#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

// Helper to read/write JSON
const jsonDb = {
  read: (table) => {
    try {
      const data = fs.readFileSync(path.join(DATA_DIR, `${table}.json`), 'utf8');
      return JSON.parse(data);
    } catch (e) { return []; }
  },
  write: (table, data) => {
    fs.writeFileSync(path.join(DATA_DIR, `${table}.json`), JSON.stringify(data, null, 2));
  }
};

const commands = {
  'add-task': (args) => {
    const description = args[0];
    const priority = args.includes('--priority') ? args[args.indexOf('--priority') + 1] : 'medium';
    const tasks = jsonDb.read('tasks');
    const newTask = {
      id: Math.random().toString(36).substr(2, 9),
      description,
      priority,
      status: 'pending',
      created_at: Date.now(),
      source: 'agent'
    };
    tasks.push(newTask);
    jsonDb.write('tasks', tasks);
    console.log(`Task added: ${description} (ID: ${newTask.id})`);
  },

  'log-expense': (args) => {
    const title = args[0];
    const amount = parseFloat(args[1]);
    const category = args.includes('--category') ? args[args.indexOf('--category') + 1] : 'other';
    const finances = jsonDb.read('finances');
    const newTx = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      amount,
      type: 'expense',
      category,
      created_at: Date.now()
    };
    finances.push(newTx);
    jsonDb.write('finances', finances);
    console.log(`Expense logged: ${title} - $${amount}`);
  },

  'list-tasks': (args) => {
    const status = args.includes('--status') ? args[args.indexOf('--status') + 1] : null;
    const tasks = jsonDb.read('tasks');
    tasks.filter(t => !status || t.status === status).forEach(t => {
      console.log(`[${t.status === 'completed' ? 'x' : ' '}] ${t.description} (ID: ${t.id})`);
    });
  },
  
  'update-task': (args) => {
    const id = args[0];
    const status = args[1]; // 'completed' or 'pending'
    const tasks = jsonDb.read('tasks');
    const task = tasks.find(t => t.id === id);
    if (task) {
      task.status = status;
      jsonDb.write('tasks', tasks);
      console.log(`Task ${id} updated to ${status}`);
    } else {
      console.log('Task not found');
    }
  }
};

const [,, cmd, ...args] = process.argv;
if (commands[cmd]) {
  commands[cmd](args);
} else {
  console.log('Usage: node agent-tools.js <command> [args]');
  console.log('Commands: add-task, log-expense, list-tasks, update-task');
}
