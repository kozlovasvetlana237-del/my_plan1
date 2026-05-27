import {
  getDailyChecklists, addDailyChecklist, toggleDailyChecklistDate, deleteDailyChecklist,
} from './state.js';

let monthOffset = 0;

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

function padDate(d) {
  return String(d).padStart(2, '0');
}

function firstWeekday(year, month) {
  return new Date(year, month - 1, 1).getDay();
}

let _calendarRefresh = null;

function refreshCalendar() {
  if (_calendarRefresh) _calendarRefresh();
}

function renderChecklist(container) {
  const key = monthKey(monthOffset);
  const d = getMonthDate(monthOffset);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const totalDays = daysInMonth(year, month);

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
    renderChecklist(container);
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
    renderChecklist(container);
  });
  nav.appendChild(nextBtn);

  header.appendChild(nav);
  container.appendChild(header);

  const startDow = firstWeekday(year, month);

  const section = document.createElement('section');
  section.className = 'monthly-section';

  const title = document.createElement('h2');
  title.className = 'section-title';
  title.textContent = 'Чек-лист ежедневных задач';
  section.appendChild(title);

  const items = getDailyChecklists(key);

  /* ── Overview calendar ── */

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

  const calCells = [];

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = key + '-' + padDate(d);
    const cell = document.createElement('span');
    cell.className = 'habit-cal-day';
    if (items.length > 0) {
      const allDone = items.every((it) => it.completedDates.includes(dateStr));
      const someDone = items.some((it) => it.completedDates.includes(dateStr));
      if (allDone) cell.classList.add('habit-cal-day-all');
      else if (someDone) cell.classList.add('habit-cal-day-some');
    }
    cell.textContent = d;
    calCells.push({ cell, dateStr });
    calendar.appendChild(cell);
  }

  _calendarRefresh = () => {
    calCells.forEach(({ cell, dateStr }) => {
      cell.className = 'habit-cal-day';
      if (items.length > 0) {
        const allDone = items.every((it) => it.completedDates.includes(dateStr));
        const someDone = items.some((it) => it.completedDates.includes(dateStr));
        if (allDone) cell.classList.add('habit-cal-day-all');
        else if (someDone) cell.classList.add('habit-cal-day-some');
      }
    });
  };

  calWrap.appendChild(calendar);
  section.appendChild(calWrap);

  /* ── Items grid ── */

  if (items.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'habit-empty';
    empty.textContent = 'Добавьте задачу для ежедневного отслеживания.';
    section.appendChild(empty);
  } else {
    const list = document.createElement('div');
    list.className = 'habit-grid-list';

    items.forEach((item) => {
      const block = document.createElement('div');
      block.className = 'habit-grid-block';

      const headerRow = document.createElement('div');
      headerRow.className = 'habit-grid-header';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'habit-grid-name';
      nameSpan.textContent = item.name;
      headerRow.appendChild(nameSpan);

      const doneCount = item.completedDates.filter((dt) => dt.startsWith(key)).length;
      const countSpan = document.createElement('span');
      countSpan.className = 'habit-grid-count';
      countSpan.textContent = `${doneCount}/${totalDays}`;
      headerRow.appendChild(countSpan);

      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-sm btn-delete';
      delBtn.textContent = '✕';
      delBtn.addEventListener('click', () => {
        deleteDailyChecklist(item.id);
        renderChecklist(container);
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
          cb.checked = item.completedDates.includes(dateStr);
          cb.addEventListener('change', () => {
            toggleDailyChecklistDate(item.id, dateStr);
            countSpan.textContent = `${item.completedDates.filter((dt) => dt.startsWith(key)).length}/${totalDays}`;
            cell.classList.toggle('habit-day-cell-checked');
            refreshCalendar();
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

  /* ── Carry-over ── */

  if (items.length > 0) {
    const carryRow = document.createElement('div');
    carryRow.className = 'checklist-carries';

    const carryBtn = document.createElement('button');
    carryBtn.className = 'btn btn-outline btn-sm';
    carryBtn.textContent = 'Перенести на следующий месяц';
    carryBtn.addEventListener('click', () => {
      const nextKey = monthKey(monthOffset + 1);
      items.forEach((item) => {
        addDailyChecklist({ name: item.name, month: nextKey });
      });
      const nextMonth = getMonthDate(monthOffset + 1);
      const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
      carryBtn.textContent = `✓ Перенесено в ${months[nextMonth.getMonth()]}`;
      carryBtn.disabled = true;
      setTimeout(() => {
        carryBtn.textContent = 'Перенести на следующий месяц';
        carryBtn.disabled = false;
      }, 2000);
    });
    carryRow.appendChild(carryBtn);

    section.appendChild(carryRow);
  }

  const addForm = document.createElement('form');
  addForm.className = 'habit-add-form';
  addForm.noValidate = true;

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'form-input';
  input.placeholder = 'Новая задача для чек-листа...';
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
    addDailyChecklist({ name: val, month: key });
    renderChecklist(container);
  });

  section.appendChild(addForm);
  container.appendChild(section);
}

export { renderChecklist };
