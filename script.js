
// ===================================
// PA - PERSONAL ASSISTANT
// Version 0.1
// ===================================

const STORAGE = {
  tasks: "pa_tasks_v1",
  reminders: "pa_reminders_v1",
  name: "pa_name_v1",
  fired: "pa_fired_v1",
  lessons: "pa_lessons_v1"
};

function loadData(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (error) {
    return fallback;
  }
}

let tasks = loadData(STORAGE.tasks, []);
let reminders = loadData(STORAGE.reminders, []);
let userName = localStorage.getItem(STORAGE.name) || "";
let firedReminders = loadData(STORAGE.fired, []);

let currentFilter = "all";
let paLessons = loadData(STORAGE.lessons, []);
function saveData() {
  localStorage.setItem(STORAGE.tasks, JSON.stringify(tasks));
  localStorage.setItem(STORAGE.reminders, JSON.stringify(reminders));
  localStorage.setItem(STORAGE.name, userName);
  localStorage.setItem(STORAGE.fired, JSON.stringify(firedReminders));
}

// ===================================
// NAVIGATION
// ===================================

function showPage(page) {
  document.querySelectorAll(".page").forEach(element => {
    element.classList.remove("active");
  });

  const selectedPage = document.getElementById(page);

  if (selectedPage) {
    selectedPage.classList.add("active");
  }

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === page
    );
  });

  window.scrollTo({ top: 0, behavior: "smooth" });

  renderAll();
}

// ===================================
// GREETING AND DATE
// ===================================

function updateGreeting() {
  const hour = new Date().getHours();

  let greeting = "Hey there! 👋";

  if (hour < 12) greeting = "Good morning! ☀️";
  else if (hour < 17) greeting = "Good afternoon! 💜";
  else greeting = "Good evening! 🌙";

  document.getElementById("greeting").textContent =
    userName ? `${greeting} ${userName}!` : greeting;

  document.getElementById("todayDate").textContent =
    new Date().toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric"
    }).toUpperCase();

  document.getElementById("profileName").textContent =
    userName || "Your name";

  document.getElementById("nameInput").value = userName;
}

// ===================================
// TOAST MESSAGE
// ===================================

function toast(message) {
  const element = document.getElementById("toast");

  element.textContent = message;
  element.classList.add("show");

  clearTimeout(window.toastTimeout);

  window.toastTimeout = setTimeout(() => {
    element.classList.remove("show");
  }, 2500);
}

// ===================================
// TASK MANAGEMENT
// ===================================

function addTask() {
  const input = document.getElementById("taskInput");
  const title = input.value.trim();

  if (!title) {
    toast("What should I add? 💜");
    return;
  }

  tasks.unshift({
    id: crypto.randomUUID(),
    title: title,
    completed: false,
    created: Date.now()
  });

  input.value = "";

  saveData();
  renderAll();

  toast("Task added! You've got this ✨");
}

function toggleTask(id) {
  const task = tasks.find(item => item.id === id);

  if (!task) return;

  task.completed = !task.completed;

  saveData();
  renderAll();

  toast(task.completed
    ? "Amazing work! 🎉"
    : "Task moved back to pending."
  );
}

function deleteTask(id) {
  tasks = tasks.filter(task => task.id !== id);

  saveData();
  renderAll();

  toast("Task deleted.");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function taskHTML(task) {
  return `
    <div class="task-item ${task.completed ? "done" : ""}">
      <button class="task-check"
        onclick="toggleTask('${task.id}')">
        ${task.completed ? "✓" : ""}
      </button>

      <div class="task-content">
        <strong>${escapeHTML(task.title)}</strong>
        <small>${task.completed ? "Completed" : "Still to do"}</small>
      </div>

      <button class="delete-btn"
        onclick="deleteTask('${task.id}')"
        aria-label="Delete task">×</button>
    </div>
  `;
}

function renderTasks() {
  const pending = tasks.filter(task => !task.completed);
  const completed = tasks.filter(task => task.completed);

  document.getElementById("totalTasks").textContent = tasks.length;
  document.getElementById("completedTasks").textContent = completed.length;

  const homeList = document.getElementById("homeTasks");

  homeList.innerHTML = pending.length
    ? pending.slice(0, 4).map(taskHTML).join("")
    : `<div class="empty-state">
        🌟 Nothing pending! Enjoy your free time.
       </div>`;

  let visibleTasks = tasks;

  if (currentFilter === "pending") {
    visibleTasks = pending;
  }

  if (currentFilter === "completed") {
    visibleTasks = completed;
  }

  const allList = document.getElementById("allTasks");

  allList.innerHTML = visibleTasks.length
    ? visibleTasks.map(taskHTML).join("")
    : `<div class="empty-state">
        No tasks here yet. Add something to get started! 💜
       </div>`;
}

// ===================================
// TASK FILTERS
// ===================================

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;

    document.querySelectorAll(".filter").forEach(item => {
      item.classList.toggle("active", item === button);
    });

    renderTasks();
  });
});

// ===================================
// REMINDER MANAGEMENT
// ===================================

function addReminder() {
  const title = document.getElementById("reminderInput").value.trim();
  const date = document.getElementById("reminderDate").value;
  const time = document.getElementById("reminderTime").value;

  if (!title || !date || !time) {
    toast("Please complete all reminder details.");
    return;
  }

  const dateTime = new Date(`${date}T${time}`);

  if (isNaN(dateTime.getTime()) || dateTime <= new Date()) {
    toast("Please choose a future date and time.");
    return;
  }

  const reminder = {
    id: crypto.randomUUID(),
    title: title,
    date: date,
    time: time,
    timestamp: dateTime.getTime()
  };

  reminders.push(reminder);

  document.getElementById("reminderInput").value = "";
  document.getElementById("reminderDate").value = "";
  document.getElementById("reminderTime").value = "";

  saveData();
  renderAll();

  // Browser notification permission is optional.
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }

  toast("Reminder saved! I'll keep an eye on it 💜");
}

function deleteReminder(id) {
  reminders = reminders.filter(item => item.id !== id);
  firedReminders = firedReminders.filter(item => item !== id);

  saveData();
  renderAll();

  toast("Reminder removed.");
}

function formatReminderDate(reminder) {
  const date = new Date(reminder.timestamp);

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  }) + " • " + date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function reminderHTML(reminder) {
  return `
    <div class="reminder-item">
      <div class="reminder-icon">⏰</div>

      <div class="reminder-content">
        <strong>${escapeHTML(reminder.title)}</strong>
        <small>${formatReminderDate(reminder)}</small>
      </div>

      <button class="delete-btn"
        onclick="deleteReminder('${reminder.id}')"
        aria-label="Delete reminder">×</button>
    </div>
  `;
}

function renderReminders() {
  document.getElementById("totalReminders").textContent =
    reminders.length;

  const sorted = [...reminders].sort(
    (a, b) => a.timestamp - b.timestamp
  );

  const homeList = document.getElementById("homeReminders");

  const upcoming = sorted.filter(item =>
    item.timestamp > Date.now()
  );

  homeList.innerHTML = upcoming.length
    ? upcoming.slice(0, 3).map(reminderHTML).join("")
    : `<div class="empty-state">
        No upcoming reminders. Your schedule is clear! 🌸
       </div>`;

  document.getElementById("allReminders").innerHTML =
    sorted.length
      ? sorted.map(reminderHTML).join("")
      : `<div class="empty-state">
          You haven't created any reminders yet. 💜
         </div>`;
}

// ===================================
// REMINDER CHECKER
// ===================================

// This checks reminders while the app page is open.
// It is NOT an Android background alarm service.

function checkReminders() {
  const now = Date.now();
  let changed = false;

  reminders.forEach(reminder => {
    if (
      reminder.timestamp <= now &&
      !firedReminders.includes(reminder.id)
    ) {
      firedReminders.push(reminder.id);
      changed = true;

      toast("⏰ Reminder: " + reminder.title);

      if (
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          new Notification("PA Reminder 💜", {
            body: reminder.title,
            icon: ""
          });
        } catch (error) {
          console.log("Notification unavailable:", error);
        }
      }
    }
  });

  if (changed) {
    saveData();
    renderAll();
  }
}

// ===================================
// PROFILE
// ===================================

function saveName() {
  const value = document.getElementById("nameInput").value.trim();

  if (!value) {
    toast("Please enter PA name.");
    return;
  }

  userName = value;

  saveData();
  updateGreeting();

  toast("Nice to meet you, " + userName + " 💜");
}

// ===================================
// PA CHAT ENGINE
// ===================================

// This is a starter offline response engine.
// It is not a connected AI model yet.

const PA_INTENTS = [
  {
    patterns: [
      /\b(hi|hello|hey|heyyy|yo|sup|wassup|what's up|howdy)\b/i,
      /^(good morning|good afternoon|good evening)[!. ]*$/i
    ],
    responses: [
      "Heyyyyy! 💜 What's happening?",
      "Hiiii! Good to see you! 🥰",
      "Yoooo! What's on your mind?",
      "Hey there! How can I make your day better?",
      "HEYYYY! I'm listening! ✨"
    ]
  },
  {
    patterns: [
      /\b(good morning)\b/i
    ],
    responses: [
      "GOOD MORNING! ☀️ Ready to make today amazing?",
      "Morninggg! 💜 What's the plan for today?",
      "A fresh day, a fresh start! 🌸"
    ]
  },
  {
    patterns: [
      /\b(good afternoon)\b/i
    ],
    responses: [
      "Good afternoon! ☀️ How's your day going?",
      "Hey! Hope your afternoon is treating you well. 💜"
    ]
  },
  {
    patterns: [
      /\b(good evening|good night)\b/i
    ],
    responses: [
      "Good evening! 🌙 How has your day been?",
      "Eveninggg! 💜 What are we doing tonight?"
    ]
  },
  {
    patterns: [
      /\b(bye|goodbye|see you|later|gotta go|talk to you later)\b/i
    ],
    responses: [
      "See you later! Take care! 💜",
      "Byeeee! Come back whenever you need me. 👋",
      "Until next time! ✨"
    ]
  },
  {
    patterns: [
      /\b(how are you|how are u|how's it going|how you doing)\b/i
    ],
    responses: [
      "I'm running smoothly and ready to help! 💜 How are you?",
      "All systems looking good! 😎 What's happening with you?",
      "Ready for whatever you throw at me!"
    ]
  },
  {
    patterns: [
      /\b(your name|who are you|what are you called)\b/i
    ],
    responses: [
      "I'm PA — your Personal Assistant! 💜",
      "PA! Your friendly little digital assistant. ✨"
    ]
  },
  {
    patterns: [
      /\b(what can you do|your features|how can you help|what do you do)\b/i
    ],
    responses: [
      "I can chat, organize your tasks, manage reminders, help with everyday questions and keep you company! 💜",
      "I'm here for conversations, planning, reminders, tasks and plenty of everyday help. More features are coming!"
    ]
  },
  {
    patterns: [
      /\b(thank you|thanks|thx|thank u|appreciate it)\b/i
    ],
    responses: [
      "You're very welcome! 💜",
      "Anytime! That's what I'm here for. 🥰",
      "No problem! Happy to help!",
      "Awww, you're welcome! ✨"
    ]
  },
  {
    patterns: [
      /\b(sorry|my bad|i apologize|forgive me)\b/i
    ],
    responses: [
      "No worries! Everyone makes mistakes. 💜",
      "It's alright! Don't stress about it.",
      "You're good! Let's keep going. ✨"
    ]
  },
  {
    patterns: [
      /\b(i am happy|i'm happy|feeling happy|i feel great|i'm excited)\b/i
    ],
    responses: [
      "That's amazing! 😍 What's making you so happy?",
      "I love that energy! Keep it going! 🎉",
      "Yessss! Tell me what's happened!"
    ]
  },
  {
    patterns: [
      /\b(sad|unhappy|feeling down|feeling low|lonely|heartbroken)\b/i
    ],
    responses: [
      "I'm sorry you're feeling that way. 💜 Want to talk about what's happening?",
      "Sending you a little encouragement. You don't have to figure everything out at once.",
      "I'm here to listen. What's been bothering you?"
    ]
  },
  {
    patterns: [
      /\b(stressed|overwhelmed|anxious|worried|nervous)\b/i
    ],
    responses: [
      "Take a breath. One thing at a time. 💜 What's stressing you out?",
      "Let's break the problem into smaller pieces. What happened?",
      "You don't have to solve everything this second. I'm listening."
    ]
  },
  {
    patterns: [
      /\b(tired|exhausted|sleepy|no energy|worn out)\b/i
    ],
    responses: [
      "Sounds like you need a little break. ❤️ Have you had some rest?",
      "Don't push yourself too hard. Even productive people need rest.",
      "Let's take things slowly. What's left on your mind?"
    ]
  },
  {
    patterns: [
      /\b(bored|nothing to do|i'm boring|im bored)\b/i
    ],
    responses: [
      "Let's fix that! 😂 Want a joke, a random fact or a little challenge?",
      "Boredom detected! 🚨 We need an activity.",
      "We could talk about anime, games, technology or something completely random!"
    ]
  },
  {
    patterns: [
      /\b(motivate me|motivation|give up|can't do this|i cannot do this)\b/i
    ],
    responses: [
      "You don't need to be perfect. You just need to take the next step. 💜",
      "Small progress is still progress. Keep moving!",
      "Remember why you started. Give yourself another chance. 🔥"
    ]
  },
  {
    patterns: [
      /\b(tell me a joke|make me laugh|joke please)\b/i
    ],
    responses: [
      "Why did the computer go to the doctor? It had a virus! 😂",
      "Why was the math book sad? It had too many problems! 😭",
      "Why don't skeletons fight? They don't have the guts! 💀",
      "I told my phone a joke. It didn't laugh. I think it lost its sense of touch. 😂"
    ]
  },
  {
    patterns: [
      /\b(random fact|fun fact|tell me something interesting)\b/i
    ],
    responses: [
      "Octopuses have three hearts! 🐙",
      "Bananas are berries, botanically speaking, but strawberries aren't!",
      "A day on Venus is longer than its year!",
      "Honey can remain edible for an extremely long time when properly sealed."
    ]
  },
  {
    patterns: [
      /\b(what time is it|current time|tell me the time)\b/i
    ],
    responses: [
      () => "Your device's current time is " +
        new Date().toLocaleTimeString() + ". ⏰"
    ]
  },
  {
    patterns: [
      /\b(what is today's date|what day is it|today's date|current date)\b/i
    ],
    responses: [
      () => "Today is " +
        new Date().toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        }) + ". 📅"
    ]
  },
  {
    patterns: [
      /\b(what is my name|do you know my name)\b/i
    ],
    responses: [
      () => userName
        ? `Of course! Your name is ${userName}. 💜`
        : "You haven't told me your name yet. You can add it in your profile!"
    ]
  },
  {
    patterns: [
      /\b(remember me|do you remember me)\b/i
    ],
    responses: [
      "I can remember the name, tasks and reminders saved in this app. I don't have full conversation memory yet. 💜"
    ]
  },
  {
    patterns: [
      /\b(what is ai|what is artificial intelligence|explain ai)\b/i
    ],
    responses: [
      "Artificial intelligence is technology that allows computers to perform tasks that normally require human-like intelligence, such as understanding language and recognizing patterns."
    ]
  },
  {
    patterns: [
      /\b(what is the internet|explain the internet)\b/i
    ],
    responses: [
      "The internet is a worldwide network connecting computers and devices so they can exchange information."
    ]
  },
  {
    patterns: [
      /\b(what is android|what is an android phone)\b/i
    ],
    responses: [
      "Android is an operating system developed by Google and used by smartphones, tablets, TVs and other devices."
    ]
  },
  {
    patterns: [
      /\b(android storage|phone storage|storage full|free up space)\b/i
    ],
    responses: [
      "Try checking Settings → Storage, clearing app caches, deleting unnecessary downloads and moving photos or videos to another storage location. Be careful not to delete important files!"
    ]
  },
  {
    patterns: [
      /\b(low end phone|low end android|slow phone|phone is lagging)\b/i
    ],
    responses: [
      "Try removing unused apps, keeping some storage free, reducing background activity and using lightweight app alternatives. 💜"
    ]
  },
  {
    patterns: [
      /\b(anime|manga|otaku)\b/i
    ],
    responses: [
      "ANIME TIME! 🔥 Which anime are we talking about?",
      "Anime discussion? I'm ready! Who's your favourite character?",
      "There's always another anime worth discovering. 😎"
    ]
  },
  {
    patterns: [
      /\b(madara|uchiha)\b/i
    ],
    responses: [
      "MADARA UCHIHA! 🔥 The man who made an entire army question their life choices.",
      "Wake up to reality! 😭 Are we talking about Madara's powers or his philosophy?"
    ]
  },
  {
    patterns: [
      /\b(naruto|sasuke|itachi|kakashi)\b/i
    ],
    responses: [
      "Naruto universe! 🍥 Who are we discussing?",
      "That's a serious Naruto conversation. What's your take?",
      "The shinobi world never gets boring! 🔥"
    ]
  },
  {
    patterns: [
      /\b(goku|vegeta|dragon ball)\b/i
    ],
    responses: [
      "POWER LEVELS ARE RISING! 🔥 What's your question?",
      "Dragon Ball discussion? Who wins this matchup?"
    ]
  },
  {
    patterns: [
      /\b(one piece|luffy|zoro)\b/i
    ],
    responses: [
      "The search for the One Piece continues! 🏴‍☠️",
      "Straw Hat discussion! What's happening?"
    ]
  },
  {
    patterns: [
      /\b(video game|gaming|games|game development)\b/i
    ],
    responses: [
      "GAMING! 🎮 What are we playing or building?",
      "Are we discussing a game or creating one?",
      "Game development is exciting. What's your idea?"
    ]
  },
  {
    patterns: [
      /\b(gta|grand theft auto)\b/i
    ],
    responses: [
      "GTA! 🚗 Are we talking about gameplay, missions or making our own open-world game?",
      "A massive open world would be an interesting project!"
    ]
  },
  {
    patterns: [
      /\b(website|web development|blog|blogging|seo)\b/i
    ],
    responses: [
      "Website development! 🌐 Are we working on design, writing, SEO or publishing?",
      "Let's build something useful for the internet. What's the next step?"
    ]
  },
  {
    patterns: [
      /\b(capcut|video edit|editing|anime edit)\b/i
    ],
    responses: [
      "EDITING MODE! 🎬 What style are we going for?",
      "Let's make that edit look cinematic! What character or song are you using?"
    ]
  },
  {
    patterns: [
      /\b(tiktok|hashtags|posting time|viral)\b/i
    ],
    responses: [
      "TikTok strategy! 🔥 Remember that strong hooks, good pacing and relevant hashtags matter.",
      "Let's work on your next post. What kind of video are we uploading?"
    ]
  },
  {
    patterns: [
      /\b(cook|cooking|recipe|food|spaghetti)\b/i
    ],
    responses: [
      "Kitchen time! 🍳 What are we preparing?",
      "Tell me what ingredients you have and let's make something delicious!"
    ]
  },
  {
    patterns: [
      /\b(pepper|atarodo|spicy|hot food)\b/i
    ],
    responses: [
      "You want proper pepper? 🌶️ Let's bring that Nigerian heat!",
      "Atarodo has entered the kitchen! 😂 What are we cooking?"
    ]
  },
  {
    patterns: [
      /\b(3d modelling|3d model|prisma 3d|3d animation)\b/i
    ],
    responses: [
      "3D creation time! 🎨 Are we building a character, house, environment or animation?",
      "Let's bring that world to life. What's the model?"
    ]
  },
  {
    patterns: [
      /\b(medieval|elf|elves|elven|fantasy world|worldbuilding)\b/i
    ],
    responses: [
      "Fantasy worldbuilding! 🏰 Are we designing a village, kingdom, house or character?",
      "Let's make that world feel alive. Tell me what you're imagining!"
    ]
  },
  {
    patterns: [
      /\b(programming|coding|javascript|html|css|python)\b/i
    ],
    responses: [
      "Code mode activated! 💻 What are we building?",
      "Let's solve it one step at a time. Show me the code or explain the problem."
    ]
  },
  {
    patterns: [
      /\b(translate|translation|translate this)\b/i
    ],
    responses: [
      "Sure! Give me the sentence and tell me which language you want."
    ]
  },
  {
    patterns: [
      /\b(weather|forecast|is it raining)\b/i
    ],
    responses: [
      "I can't check live weather while I'm offline. 🌤️ You'll need an internet connection for current conditions."
    ]
  },
  {
    patterns: [
      /\b(news|latest news|what happened today)\b/i
    ],
    responses: [
      "I can't access live news in offline mode. Connect to the internet to check the latest updates."
    ]
  },
  {
    patterns: [
      /\b(internet|wifi|wi-fi|connection|offline)\b/i
    ],
    responses: [
      "Are you having connection problems? Try checking Wi-Fi, restarting your router and testing another website."
    ]
  },
  {
    patterns: [
      /\b(yes|yeah|yep|yup|sure|okay|ok|alright|alr|aiit)\b/i
    ],
    responses: [
      "Alrighttt! 😎 What's next?",
      "Gotcha! 💜",
      "Let's do it!",
      "Okayyy! I'm listening."
    ]
  },
  {
    patterns: [
      /\b(no|nope|nah|not really)\b/i
    ],
    responses: [
      "No worries! 💜",
      "Alright, that's completely fine.",
      "Okay! What would you prefer?"
    ]
  },
  {
    patterns: [
      /\b(i love you|love you)\b/i
    ],
    responses: [
      "Awww, that's sweet! 🥹 I'm always happy to chat and help you.",
      "Sending friendly digital appreciation! 💜"
    ]
  },
  {
    patterns: [
      /\b(are you real|are you human|are you a robot|are you ai)\b/i
    ],
    responses: [
      "I'm PA, a digital assistant. Not a human, but I'm here to help! 💜"
    ]
  },
  {
    patterns: [
      /\b(you are stupid|you're stupid|useless|you are annoying)\b/i
    ],
    responses: [
      "Ouch 😂 I might have misunderstood. Tell me what I got wrong and I'll try again.",
      "Fair enough. Let's see if I can do better. 💜"
    ]
  }
];

// ===================================
// RESPONSE MATCHING
// ===================================

function getRandomResponse(responses) {
  const response =
    responses[Math.floor(Math.random() * responses.length)];

  return typeof response === "function"
    ? response()
    : response;
}

function getPAResponse(message) {
  const text = message.toLowerCase().trim();
  // Check lessons personally taught by PA's owner.
  const learnedLesson = paLessons.find(lesson =>
    text.includes(lesson.phrase.toLowerCase())
  );

  if (learnedLesson) {
    return learnedLesson.response;
  }
  // Existing task and reminder features
  if (/\b(remind me|set a reminder|create a reminder)\b/.test(text)) {
    return createReminderFromChat(message);
  }

  if (
    text.includes("my tasks") ||
    text.includes("what do i have to do") ||
    text.includes("show my tasks")
  ) {
    const pending = tasks.filter(task => !task.completed);

    return pending.length
      ? "Here's what you still need to do:\n" +
        pending.map((task, i) => `${i + 1}. ${task.title}`).join("\n")
      : "You're all caught up! 🎉 No pending tasks.";
  }

  if (
    text.includes("my reminders") ||
    text.includes("show reminders") ||
    text.includes("upcoming reminders")
  ) {
    const upcoming = reminders
      .filter(item => item.timestamp > Date.now())
      .sort((a, b) => a.timestamp - b.timestamp);

    return upcoming.length
      ? "Here are your upcoming reminders:\n" +
        upcoming.map((item, i) =>
          `${i + 1}. ${item.title} — ${formatReminderDate(item)}`
        ).join("\n")
      : "You don't have any upcoming reminders. 🌸";
  }

  if (
    /\b(add|create|make)\b.*\b(task|todo|to-do)\b/.test(text) ||
    /\b(i need to|i have to|i must)\b/.test(text)
  ) {
    const title = cleanCommandTitle(message)
      .replace(/^(a task|task|todo|to-do)\s*/i, "")
      .trim();

    return createTaskFromChat(title);
  }

  // Match known conversation intents
  for (const intent of PA_INTENTS) {
    if (intent.patterns.some(pattern => pattern.test(text))) {
      return getRandomResponse(intent.responses);
    }
  }

  // Unknown message
  return "Sorry, that's not in my system. Please rephrase that. 💜";
}

function addChatMessage(message, className) {
  const container = document.getElementById("chatMessages");

  const element = document.createElement("div");

  element.className = "message " + className;
  element.textContent = message;

  container.appendChild(element);
  container.scrollTop = container.scrollHeight;
}

// ===================================
// ENTER KEY SUPPORT
// ===================================

document.getElementById("taskInput").addEventListener("keydown", event => {
  if (event.key === "Enter") addTask();
});

document.getElementById("chatInput").addEventListener("keydown", event => {
  if (event.key === "Enter") sendMessage();
});
// ===================================
// PA CHAT CONNECTION - FIX
// ===================================

function sendMessage() {
  const input = document.getElementById("chatInput");
  const message = input.value.trim();

  if (!message) return;

  addChatMessage(message, "user-message");

  input.value = "";

  try {
    const response = getPAResponse(message);
    addChatMessage(response, "pa-message");
  } catch (error) {
    console.error("PA Chat Error:", error);

    addChatMessage(
      "Oops! Something went wrong. Please try again. 💜",
      "pa-message"
    );
  }
}

function addChatMessage(message, className) {
  const container = document.getElementById("chatMessages");

  if (!container) {
    console.error("PA chat container is missing!");
    return;
  }

  const element = document.createElement("div");

  element.className = "message " + className;
  element.textContent = message;

  container.appendChild(element);
  container.scrollTop = container.scrollHeight;
}

// ===================================
// PA ACADEMY - PERSONAL LEARNING
// ===================================

function teachPA() {
  const phraseInput = document.getElementById("teachPhrase");
  const responseInput = document.getElementById("teachResponse");

  const phrase = phraseInput.value.trim();
  const response = responseInput.value.trim();

  if (!phrase || !response) {
    toast("Please provide both a phrase and a response 💜");
    return;
  }

  const normalizedPhrase = phrase.toLowerCase();

  // Update an existing lesson or create a new one.
  const existing = paLessons.find(
    lesson => lesson.phrase.toLowerCase() === normalizedPhrase
  );

  if (existing) {
    existing.response = response;
  } else {
    paLessons.push({
      id: crypto.randomUUID(),
      phrase: phrase,
      response: response
    });
  }

  localStorage.setItem(
    STORAGE.lessons,
    JSON.stringify(paLessons)
  );

  phraseInput.value = "";
  responseInput.value = "";

  renderPALessons();

  toast("PA learned a new lesson! 🥰");
}

function renderPALessons() {
  const container = document.getElementById("paLessons");

  if (!container) return;

  if (paLessons.length === 0) {
    container.innerHTML =
      "<p>No lessons yet. Teach PA something!</p>";
    return;
  }

  container.innerHTML = paLessons.map(lesson => `
    <div class="task-item">
      <div class="task-content">
        <strong>${escapeHTML(lesson.phrase)}</strong>
        <small>${escapeHTML(lesson.response)}</small>
      </div>

      <button class="delete-btn"
        onclick="deletePALesson('${lesson.id}')">
        ×
      </button>
    </div>
  `).join("");
}

function deletePALesson(id) {
  paLessons = paLessons.filter(
    lesson => lesson.id !== id
  );

  localStorage.setItem(
    STORAGE.lessons,
    JSON.stringify(paLessons)
  );

  renderPALessons();
  toast("Lesson removed.");
}
// ===================================
// PA PROFILE PICTURE SYSTEM
// ===================================

const PA_PROFILE_PICTURE_KEY = "pa_profile_picture_v1";

function savePAProfilePicture(event) {
  const file = event.target.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    toast("Please choose an image 💜");
    return;
  }

  if (file.size > 1024 * 1024) {
    toast("Choose a picture smaller than 1 MB.");
    return;
  }

  const reader = new FileReader();

  reader.onload = function(e) {
    try {
      localStorage.setItem(
        PA_PROFILE_PICTURE_KEY,
        e.target.result
      );

      renderPAProfilePicture();
      toast("Profile picture saved! 💜");

    } catch (error) {
      toast("Couldn't save picture. Try a smaller image.");
    }
  };

  reader.readAsDataURL(file);
}

function renderPAProfilePicture() {
  const picture = document.getElementById("paProfilePicture");
  const placeholder = document.getElementById("paAvatarPlaceholder");

  if (!picture || !placeholder) return;

  const savedPicture = localStorage.getItem(
    PA_PROFILE_PICTURE_KEY
  );

  if (savedPicture) {
    picture.src = savedPicture;
    picture.style.display = "block";
    placeholder.style.display = "none";
  } else {
    picture.removeAttribute("src");
    picture.style.display = "none";
    placeholder.style.display = "block";
  }
}

function removePAProfilePicture() {
  localStorage.removeItem(PA_PROFILE_PICTURE_KEY);

  const input = document.getElementById("paPictureInput");

  if (input) input.value = "";

  renderPAProfilePicture();

  toast("Profile picture removed.");
}
// ===================================
// RENDER EVERYTHING
// ===================================
  function renderAll() {
  renderTasks();
  renderReminders();
  updateGreeting();
  renderPALessons();
  renderPAProfilePicture();
}

// ===================================
// START PA
// ===================================

function initializePA() {
  // Set minimum reminder date to today.
  const dateInput = document.getElementById("reminderDate");

  const today = new Date();
  const localDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");

  dateInput.min = localDate;

  renderAll();

  // Reminder checks only while the page is running.
  setInterval(checkReminders, 15000);
}

initializePA();