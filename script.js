// DOM Elements
const taskInput = document.getElementById('taskInput');
const tagInput = document.getElementById('tagInput');
const deadlineInput = document.getElementById('deadlineInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const filterBtns = document.querySelectorAll('.filter-btn');
const tagFilterBtns = document.querySelectorAll('.tag-filter-btn');
const tagFilterContainer = document.getElementById('tagFilterContainer');
const clearBtn = document.getElementById('clearBtn');
const totalCount = document.getElementById('totalCount');
const completedCount = document.getElementById('completedCount');
const remainingCount = document.getElementById('remainingCount');

// State
let tasks = [];
let currentFilter = 'all';
let currentTagFilter = 'all';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    renderTasks();
    updateStats();
    updateTagFilters();
});

// Event Listeners
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.dataset.filter;
        renderTasks();
    });
});

tagFilterContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('tag-filter-btn')) {
        document.querySelectorAll('.tag-filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentTagFilter = e.target.dataset.tag;
        renderTasks();
    }
});

clearBtn.addEventListener('click', clearCompleted);

// Functions
function addTask() {
    const taskText = taskInput.value.trim();
    
    if (taskText === '') {
        alert('Masukkan tugas terlebih dahulu!');
        taskInput.focus();
        return;
    }

    // Parse tags
    const tagsInput = tagInput.value.trim();
    const tags = tagsInput 
        ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
        : [];

    const task = {
        id: Date.now(),
        text: taskText,
        tags: tags,
        deadline: deadlineInput.value || null,
        completed: false,
        date: new Date().toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    };

    tasks.push(task);
    taskInput.value = '';
    tagInput.value = '';
    deadlineInput.value = '';
    taskInput.focus();
    saveTasks();
    renderTasks();
    updateStats();
    updateTagFilters();
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
    updateStats();
    updateTagFilters();
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        updateStats();
    }
}

function calculateCountdown(deadline) {
    if (!deadline) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);

    const timeDiff = deadlineDate - today;
    const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
        return { days: Math.abs(daysLeft), type: 'overdue' };
    } else if (daysLeft === 0) {
        return { days: 0, type: 'today' };
    } else {
        return { days: daysLeft, type: 'upcoming' };
    }
}

function getCountdownText(countdown) {
    if (!countdown) return '';

    let text = '';
    if (countdown.type === 'overdue') {
        text = `${countdown.days} hari yang lalu`;
    } else if (countdown.type === 'today') {
        text = 'Hari ini!';
    } else {
        text = `${countdown.days} hari lagi`;
    }
    return text;
}

function clearCompleted() {
    if (tasks.some(t => t.completed)) {
        if (confirm('Hapus semua tugas yang sudah selesai?')) {
            tasks = tasks.filter(t => !t.completed);
            saveTasks();
            renderTasks();
            updateStats();
            updateTagFilters();
        }
    }
}

function renderTasks() {
    taskList.innerHTML = '';

    const filteredTasks = tasks.filter(task => {
        // Filter by status
        if (currentFilter === 'completed' && !task.completed) return false;
        if (currentFilter === 'active' && task.completed) return false;

        // Filter by tag
        if (currentTagFilter !== 'all') {
            const taskTags = task.tags || [];
            return taskTags.includes(currentTagFilter);
        }

        return true;
    });

    if (filteredTasks.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        
        const tagsHtml = (task.tags && task.tags.length > 0)
            ? `<div class="task-tags">${task.tags.map(tag => `<span class="task-tag">${escapeHtml(tag)}</span>`).join('')}</div>`
            : '';

        let deadlineHtml = '';
        if (task.deadline) {
            const countdown = calculateCountdown(task.deadline);
            const deadlineDate = new Date(task.deadline).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
            const countdownClass = countdown ? `countdown-${countdown.type}` : '';
            const countdownText = countdown ? getCountdownText(countdown) : '';
            
            deadlineHtml = `<div class="task-deadline">
                <span class="task-deadline-date">📅 ${deadlineDate}</span>
                ${countdownText ? `<span class="task-countdown ${countdownClass}">${countdownText}</span>` : ''}
            </div>`;
        }

        li.innerHTML = `
            <input 
                type="checkbox" 
                class="task-checkbox" 
                ${task.completed ? 'checked' : ''}
                onchange="toggleTask(${task.id})"
            >
            <div class="task-content">
                <span class="task-text">${escapeHtml(task.text)}</span>
                <span class="task-date">${task.date}</span>
                ${tagsHtml}
                ${deadlineHtml}
            </div>
            <button class="task-delete" onclick="deleteTask(${task.id})">Hapus</button>
        `;
        taskList.appendChild(li);
    });
}

function updateTagFilters() {
    // Kumpulkan semua tag unik dari tasks
    const allTags = new Set();
    tasks.forEach(task => {
        if (task.tags && task.tags.length > 0) {
            task.tags.forEach(tag => allTags.add(tag));
        }
    });

    // Update tag filter container
    tagFilterContainer.innerHTML = '<button class="tag-filter-btn active" data-tag="all">Semua Tag</button>';

    if (allTags.size > 0) {
        allTags.forEach(tag => {
            const btn = document.createElement('button');
            btn.className = 'tag-filter-btn';
            btn.dataset.tag = tag;
            btn.textContent = tag;
            tagFilterContainer.appendChild(btn);
        });
    }

    // Re-attach event listeners untuk tag filter buttons yang baru
    document.querySelectorAll('.tag-filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tag-filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentTagFilter = e.target.dataset.tag;
            renderTasks();
        });
    });
}

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const remaining = total - completed;

    totalCount.textContent = total;
    completedCount.textContent = completed;
    remainingCount.textContent = remaining;

    // Disable clear button jika tidak ada tugas selesai
    clearBtn.disabled = completed === 0;
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
    const saved = localStorage.getItem('tasks');
    tasks = saved ? JSON.parse(saved) : [];
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
