import {
  getMonthlyGoals, addMonthlyGoal, updateMonthlyGoal, deleteMonthlyGoal,
  getHabits, addHabit, toggleHabitDate, deleteHabit,
} from './state.js';

let monthOffset = 0;
let selectedHabitDay = null;

function getMonthDate(offset) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return d;
}

function monthKey(offset) {
  const d = getMonthDate(offset);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

function monthLabel(offset) {
  const d = getMonthDate(offset);
  const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  return months[d.getMonth()] + ' ' + d.getFullYear();
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function firstWeekday(year, month) {
  return new Date(year, month - 1, 1).getDay();
}

function padDate(d) {
  return String(d).padStart(2, '0');
}

function renderMonthlyPlan(container) {
  const key = monthKey(monthOffset);
  const d = getMonthDate(monthOffset);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const totalDays = daysInMonth(year, month);
  const startDow = firstWeekday(year, month);

  if (!selectedHabitDay) {
    selectedHabitDay = key + '-' + padDate(d.getDate() > totalDays ? totalDays : d.getDate());
  }

  container.innerHTML = '';

  const header = document.createElement('header');
  header.className = 'dashboard-header monthly-header';

  const nav = document.createElement('div');
  nav.className = 'month-nav';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'month-nav-btn';
  prevBtn.textContent = '◀';
  prevBtn.addEventListener('click', () => {
    monthOffset--;
    selectedHabitDay = null;
    renderMonthlyPlan(container);
  });
  nav.appendChild(prevBtn);

  const label = document.createElement('h1');
  label.textContent = monthLabel(monthOffset);
  nav.appendChild(label);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'month-nav-btn';
  nextBtn.textContent = '▶';
  nextBtn.addEventListener('click', () => {
    monthOffset++;
    selectedHabitDay = null;
    renderMonthlyPlan(container);
  });
  nav.appendChild(nextBtn);

  header.appendChild(nav);
  container.appendChild(header);

  const layout = document.createElement('div');
  layout.className = 'monthly-layout';

  renderGoalsSection(layout, key);
  renderHabitsSection(layout, key, year, month, totalDays, startDow);

  container.appendChild(layout);
}

/* ── Goals ── */

function renderGoalsSection(container, key) {
  const section = document.createElement('section');
  section.className = 'monthly-section monthly-goals-section';

  const title = document.createElement('h2');
  title.className = 'section-title';
  title.textContent = 'Цели на месяц';
  section.appendChild(title);

  const goalsList = document.createElement('div');
  goalsList.className = 'goals-list';

  const goals = getMonthlyGoals(key);

  goals.forEach((goal) => {
    const row = document.createElement('div');
    row.className = 'goal-row';

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'main-goal-' + key;
    radio.className = 'goal-radio';
    radio.checked = goal.isMainGoal;
    radio.addEventListener('change', () => {
      if (radio.checked) {
        updateMonthlyGoal(goal.id, { isMainGoal: true });
        renderMonthlyPlan(container.closest('.app-content') || container.parentElement);
      }
    });
    row.appendChild(radio);

    const label = document.createElement('span');
    label.className = 'goal-title' + (goal.isMainGoal ? ' goal-main' : '');
    label.textContent = goal.title;
    row.appendChild(label);

    if (goal.isMainGoal) {
      const badge = document.createElement('span');
      badge.className = 'goal-badge';
      badge.textContent = 'Ключевая';
      row.appendChild(badge);
    }

    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-sm btn-delete goal-del';
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', () => {
      deleteMonthlyGoal(goal.id);
      renderMonthlyPlan(container.closest('.app-content') || container.parentElement);
    });
    row.appendChild(delBtn);

    goalsList.appendChild(row);
  });

  section.appendChild(goalsList);

  const addForm = document.createElement('form');
  addForm.className = 'goal-add-form';
  addForm.noValidate = true;

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'form-input';
  input.placeholder = 'Новая цель...';
  input.required = true;
  input.maxLength = 200;
  addForm.appendChild(input);

  const addBtn = document.createElement('button');
  addBtn.type = 'submit';
  addBtn.className = 'btn btn-primary btn-sm';
  addBtn.textContent = 'Добавить';
  addForm.appendChild(addBtn);

  addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = input.value.trim();
    if (!val) return;
    const isFirst = goals.length === 0;
    addMonthlyGoal({ title: val, month: key, isMainGoal: isFirst });
    renderMonthlyPlan(container.closest('.app-content') || container.parentElement);
  });

  section.appendChild(addForm);
  container.appendChild(section);
}

/* ── Habits ── */

function renderHabitsSection(container, key, year, month, totalDays, startDow) {
  const section = document.createElement('section');
  section.className = 'monthly-section monthly-habits-section';

  const title = document.createElement('h2');
  title.className = 'section-title';
  title.textContent = 'Трекер привычек';
  section.appendChild(title);

  const habits = getHabits(key);

  /* ── Small overview calendar ── */

  const calWrap = document.createElement('div');
  calWrap.className = 'habit-cal-wrap';

  const calendar = document.createElement('div');
  calendar.className = 'habit-calendar habit-calendar-sm';

  const dayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  dayLabels.forEach((dl) => {
    const lbl = document.createElement('span');
    lbl.className = 'habit-cal-dow';
    lbl.textContent = dl;
    calendar.appendChild(lbl);
  });

  const sunStart = startDow === 0 ? 6 : startDow - 1;
  for (let i = 0; i < sunStart; i++) {
    const empty = document.createElement('span');
    empty.className = 'habit-cal-empty';
    calendar.appendChild(empty);
  }

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = key + '-' + padDate(d);
    const cell = document.createElement('span');
    cell.className = 'habit-cal-day';
    if (habits.length > 0) {
      const allDone = habits.every((h) => h.completedDates.includes(dateStr));
      const someDone = habits.some((h) => h.completedDates.includes(dateStr));
      if (allDone) cell.classList.add('habit-cal-day-all');
      else if (someDone) cell.classList.add('habit-cal-day-some');
    }
    cell.textContent = d;
    calendar.appendChild(cell);
  }

  calWrap.appendChild(calendar);
  section.appendChild(calWrap);

  /* ── Habit rows with 2-row checkboxes ── */

  if (habits.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'habit-empty';
    empty.textContent = 'Добавьте привычку, чтобы начать отслеживание.';
    section.appendChild(empty);
  } else {
    const list = document.createElement('div');
    list.className = 'habit-grid-list';

    habits.forEach((habit) => {
      const block = document.createElement('div');
      block.className = 'habit-grid-block';

      const headerRow = document.createElement('div');
      headerRow.className = 'habit-grid-header';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'habit-grid-name';
      nameSpan.textContent = habit.name;
      headerRow.appendChild(nameSpan);

      const doneCount = habit.completedDates.filter((dt) => dt.startsWith(key)).length;
      const countSpan = document.createElement('span');
      countSpan.className = 'habit-grid-count';
      countSpan.textContent = `${doneCount}/${totalDays}`;
      headerRow.appendChild(countSpan);

      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-sm btn-delete';
      delBtn.textContent = '✕';
      delBtn.addEventListener('click', () => {
        deleteHabit(habit.id);
        renderMonthlyPlan(container.closest('.app-content') || container.parentElement);
      });
      headerRow.appendChild(delBtn);

      block.appendChild(headerRow);

      const grid = document.createElement('div');
      grid.className = 'habit-days-grid';

      const half = Math.ceil(totalDays / 2);
      for (let row = 0; row < 2; row++) {
        const start = row === 0 ? 1 : half + 1;
        const end = row === 0 ? half : totalDays;
        for (let d = start; d <= end; d++) {
          const dateStr = key + '-' + padDate(d);
          const cell = document.createElement('label');
          cell.className = 'habit-day-cell';
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.className = 'habit-day-cb';
          cb.checked = habit.completedDates.includes(dateStr);
          cb.addEventListener('change', () => {
            toggleHabitDate(habit.id, dateStr);
            countSpan.textContent = `${habit.completedDates.filter((dt) => dt.startsWith(key)).length}/${totalDays}`;
            cell.classList.toggle('habit-day-cell-checked');
          });
          cell.appendChild(cb);
          const num = document.createElement('span');
          num.className = 'habit-day-num';
          num.textContent = d;
          cell.appendChild(num);
          if (cb.checked) cell.classList.add('habit-day-cell-checked');
          grid.appendChild(cell);
        }
      }

      block.appendChild(grid);
      list.appendChild(block);
    });

    section.appendChild(list);
  }

  /* ── Add habit form ── */

  const addForm = document.createElement('form');
  addForm.className = 'habit-add-form';
  addForm.noValidate = true;

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'form-input';
  input.placeholder = 'Новая привычка...';
  input.required = true;
  input.maxLength = 200;
  addForm.appendChild(input);

  const addBtn = document.createElement('button');
  addBtn.type = 'submit';
  addBtn.className = 'btn btn-primary btn-sm';
  addBtn.textContent = 'Добавить';
  addForm.appendChild(addBtn);

  addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = input.value.trim();
    if (!val) return;
    addHabit({ name: val, month: key });
    renderMonthlyPlan(container.closest('.app-content') || container.parentElement);
  });

  section.appendChild(addForm);
  container.appendChild(section);
}

export { renderMonthlyPlan };
