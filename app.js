/* =========================================================
   CLASSROOM LIVE
   Supabase Application Logic
========================================================= */

/* =========================================================
   SUPABASE CONFIG
========================================================= */

const SUPABASE_URL =
  "https://ltbawcggixrnjhygjstg.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_rcHxJiBKbR3u6fnd4PNHGw_mBODmku4";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


/* =========================================================
   GLOBAL STATE
========================================================= */

const state = {
  user: null,
  role: null,
  student: null,
  room: null,

  students: [],
  messages: [],
  reactions: [],

  subscription: null,
  presenceChannel: null,

  onlineUsers: new Set(),

  replyTo: null,
  selectedStudent: null,

  restrictionTimer: null,

  reconnecting: false
};


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (selector) =>
  document.querySelector(selector);

const $$ = (selector) =>
  document.querySelectorAll(selector);


/* =========================================================
   DOM ELEMENTS
========================================================= */

const loginScreen = $("#loginScreen");
const studentApp = $("#studentApp");
const lecturerApp = $("#lecturerApp");

const studentTab = $("#studentTab");
const lecturerTab = $("#lecturerTab");

const studentLoginForm = $("#studentLoginForm");
const lecturerLoginForm = $("#lecturerLoginForm");

const loginMessage = $("#loginMessage");

const messagesContainer = $("#messagesContainer");
const participantsList = $("#participantsList");

const messageForm = $("#messageForm");
const messageInput = $("#messageInput");

const restrictionNotice = $("#restrictionNotice");
const restrictionCountdown = $("#restrictionCountdown");

const typingIndicator = $("#typingIndicator");

const reactionPicker = $("#reactionPicker");

const restrictionModal = $("#restrictionModal");

const toast = $("#toast");


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  initializeApp
);

async function initializeApp() {

  setupUIEvents();

  await checkExistingSession();

  supabaseClient.auth.onAuthStateChange(
    async (event, session) => {

      if (
        event === "SIGNED_IN" &&
        session
      ) {
        await handleAuthenticatedUser(
          session.user
        );
      }

      if (event === "SIGNED_OUT") {
        resetApplication();
      }

    }
  );
}


/* =========================================================
   AUTHENTICATION
========================================================= */

async function checkExistingSession() {

  const {
    data,
    error
  } = await supabaseClient.auth.getSession();

  if (error) {
    console.error(error);
    return;
  }

  if (data.session) {
    await handleAuthenticatedUser(
      data.session.user
    );
  }
}


async function handleAuthenticatedUser(user) {

  state.user = user;

  const roleResult =
    await getUserRole(user.id);

  if (!roleResult) {

    showLoginError(
      "Your account has not been assigned a classroom role."
    );

    await supabaseClient.auth.signOut();

    return;
  }

  state.role = roleResult.role;

  if (state.role === "student") {

    await loadStudentAccount(
      roleResult.student_id
    );

    await openStudentApplication();

  } else if (
    state.role === "lecturer"
  ) {

    await openLecturerApplication();

  } else {

    showLoginError(
      "Unknown account role."
    );
  }
}


/* =========================================================
   GET USER ROLE
========================================================= */

async function getUserRole(userId) {

  const {
    data,
    error
  } = await supabaseClient
    .from("user_roles")
    .select(
      "user_id, role, student_id"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {

    console.error(
      "Role lookup error:",
      error
    );

    return null;
  }

  return data;
}


/* =========================================================
   STUDENT LOGIN
========================================================= */

studentLoginForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    const studentId =
      $("#studentId")
        .value
        .trim()
        .toLowerCase();

    const password =
      $("#studentPassword").value;

    if (!studentId || !password) {

      showLoginError(
        "Enter your Student ID and password."
      );

      return;
    }

    setLoginLoading(true);

    /*
      Student IDs are mapped to internal
      authentication emails.

      Example:
      student01 → student01@classroom.test

      IMPORTANT:
      These accounts must already exist
      in Supabase Auth.
    */

    const email =
      `${studentId}@classroom.test`;

    const {
      data,
      error
    } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    setLoginLoading(false);

    if (error) {

      showLoginError(
        "Invalid Student ID or password."
      );

      console.error(error);

      return;
    }

    if (data.user) {

      await handleAuthenticatedUser(
        data.user
      );
    }

  }
);


/* =========================================================
   LECTURER LOGIN
========================================================= */

lecturerLoginForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    const email =
      $("#lecturerEmail").value.trim();

    const password =
      $("#lecturerPassword").value;

    if (!email || !password) {

      showLoginError(
        "Enter your lecturer email and password."
      );

      return;
    }

    setLoginLoading(true);

    const {
      data,
      error
    } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    setLoginLoading(false);

    if (error) {

      showLoginError(
        "Invalid lecturer credentials."
      );

      console.error(error);

      return;
    }

    if (data.user) {

      await handleAuthenticatedUser(
        data.user
      );
    }

  }
);


/* =========================================================
   LOAD STUDENT ACCOUNT
========================================================= */

async function loadStudentAccount(
  studentUuid
) {

  const {
    data,
    error
  } = await supabaseClient
    .from("students")
    .select("*")
    .eq("id", studentUuid)
    .single();

  if (error) {

    console.error(
      "Student lookup error:",
      error
    );

    showToast(
      "Unable to load student profile."
    );

    return;
  }

  state.student = data;
}


/* =========================================================
   LOAD CLASSROOM
========================================================= */

async function loadRoom() {

  const {
    data,
    error
  } = await supabaseClient
    .from("rooms")
    .select("*")
    .order(
      "created_at",
      { ascending: true }
    )
    .limit(1)
    .single();

  if (error) {

    console.error(
      "Room error:",
      error
    );

    return null;
  }

  state.room = data;

  return data;
}


/* =========================================================
   OPEN STUDENT APPLICATION
========================================================= */

async function openStudentApplication() {

  hide(loginScreen);

  show(studentApp);

  await loadRoom();

  await loadStudents();

  await loadMessages();

  await loadRestrictions();

  renderStudents();

  renderMessages();

  setupRealtime();

  setupPresence();

  updateStudentOnlineStatus(true);

  startRestrictionWatcher();

  updateOnlineCount();

}


/* =========================================================
   OPEN LECTURER APPLICATION
========================================================= */

async function openLecturerApplication() {

  hide(loginScreen);

  show(lecturerApp);

  await loadRoom();

  await loadStudents();

  await loadMessages();

  await loadRestrictions();

  renderLecturerStudents();

  renderLecturerActivity();

  setupRealtime();

  setupPresence();

  updateOnlineCount();

}


/* =========================================================
   LOAD STUDENTS
========================================================= */

async function loadStudents() {

  const {
    data,
    error
  } = await supabaseClient
    .from("students")
    .select("*")
    .order(
      "student_id",
      { ascending: true }
    );

  if (error) {

    console.error(
      "Students error:",
      error
    );

    return;
  }

  state.students = data || [];
}


/* =========================================================
   LOAD MESSAGES
========================================================= */

async function loadMessages() {

  if (!state.room) return;

  const {
    data,
    error
  } = await supabaseClient
    .from("messages")
    .select(`
      id,
      room_id,
      student_id,
      message,
      created_at,
      students (
        student_id,
        display_name,
        color
      )
    `)
    .eq(
      "room_id",
      state.room.id
    )
    .order(
      "created_at",
      { ascending: true }
    )
    .limit(500);

  if (error) {

    console.error(
      "Messages error:",
      error
    );

    return;
  }

  state.messages = data || [];

}


/* =========================================================
   SEND MESSAGE
========================================================= */

messageForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    await sendMessage();

  }
);


async function sendMessage() {

  if (!state.user || !state.room) {
    return;
  }

  if (
    state.role === "student" &&
    !state.student
  ) {
    return;
  }

  const message =
    messageInput.value.trim();

  if (!message) return;

  if (
    state.role === "student" &&
    isStudentRestricted()
  ) {

    showToast(
      "You are temporarily restricted."
    );

    return;
  }


  const studentId =
    state.role === "student"
      ? state.student.id
      : null;


  /*
    The existing messages table requires
    student_id to reference students.id.

    Therefore lecturer messages require
    a dedicated lecturer/student identity
    strategy in the database.

    V1 keeps lecturer sending disabled
    until that mapping exists.
  */

  if (!studentId) {

    showToast(
      "Lecturer message identity is not configured yet."
    );

    return;
  }


  const payload = {

    room_id: state.room.id,

    student_id: studentId,

    message

  };


  const {
    error
  } = await supabaseClient
    .from("messages")
    .insert(payload);

  if (error) {

    console.error(
      "Send message error:",
      error
    );

    showToast(
      "Message could not be sent."
    );

    return;
  }


  messageInput.value = "";

  clearReply();

}


/* =========================================================
   RENDER MESSAGES
========================================================= */

function renderMessages() {

  if (!messagesContainer) return;

  const emptyChat =
    $("#emptyChat");

  if (state.messages.length === 0) {

    if (emptyChat) {
      show(emptyChat);
    }

    return;
  }

  if (emptyChat) {
    hide(emptyChat);
  }


  messagesContainer
    .querySelectorAll(".message")
    .forEach(
      element => element.remove()
    );


  state.messages.forEach(
    message => {

      const student =
        message.students ||
        findStudent(message.student_id);

      if (!student) return;

      const element =
        createMessageElement(
          message,
          student
        );

      messagesContainer.appendChild(
        element
      );

    }
  );


  scrollMessagesToBottom();

}


/* =========================================================
   CREATE MESSAGE ELEMENT
========================================================= */

function createMessageElement(
  message,
  student
) {

  const wrapper =
    document.createElement("div");

  const isMine =
    state.student &&
    message.student_id ===
      state.student.id;

  wrapper.className =
    `message ${isMine ? "mine" : ""}`;


  const avatar =
    document.createElement("div");

  avatar.className =
    "message-avatar";

  avatar.style.background =
    student.color || "#4F46E5";

  avatar.textContent =
    getInitials(
      student.display_name ||
      student.student_id
    );


  const content =
    document.createElement("div");

  content.className =
    "message-content";


  const author =
    document.createElement("div");

  author.className =
    "message-author";

  author.style.color =
    student.color || "#4F46E5";


  const name =
    document.createElement("span");

  name.textContent =
    student.display_name ||
    student.student_id;


  const time =
    document.createElement("span");

  time.className =
    "message-time";

  time.textContent =
    formatTime(message.created_at);


  author.append(
    name,
    time
  );


  const bubble =
    document.createElement("div");

  bubble.className =
    "message-bubble";

  bubble.textContent =
    message.message;


  const actions =
    document.createElement("div");

  actions.className =
    "message-actions";


  const reactButton =
    document.createElement("button");

  reactButton.className =
    "message-action";

  reactButton.type =
    "button";

  reactButton.textContent =
    "React";

  reactButton.addEventListener(
    "click",
    event => {

      openReactionPicker(
        event,
        message.id
      );

    }
  );


  const replyButton =
    document.createElement("button");

  replyButton.className =
    "message-action";

  replyButton.type =
    "button";

  replyButton.textContent =
    "Reply";

  replyButton.addEventListener(
    "click",
    () => {

      setReply(
        message,
        student
      );

    }
  );


  actions.append(
    reactButton,
    replyButton
  );


  content.append(
    author,
    bubble,
    actions
  );


  wrapper.append(
    avatar,
    content
  );


  return wrapper;
}


/* =========================================================
   LOAD RESTRICTIONS
========================================================= */

async function loadRestrictions() {

  if (!state.user) return;

  const {
    data,
    error
  } = await supabaseClient
    .from("restrictions")
    .select("*")
    .gt(
      "expires_at",
      new Date().toISOString()
    );

  if (error) {

    console.error(
      "Restriction error:",
      error
    );

    return;
  }

  state.restrictions =
    data || [];

  updateRestrictionUI();
}


/* =========================================================
   CHECK RESTRICTION
========================================================= */

function isStudentRestricted() {

  if (
    state.role !== "student" ||
    !state.student
  ) {
    return false;
  }

  if (!state.restrictions) {
    return false;
  }

  return state.restrictions.some(
    restriction =>
      restriction.student_id ===
        state.student.id &&
      new Date(
        restriction.expires_at
      ) > new Date()
  );
}


/* =========================================================
   RESTRICTION UI
========================================================= */

function updateRestrictionUI() {

  if (
    state.role !== "student" ||
    !state.student
  ) {
    return;
  }

  const restriction =
    state.restrictions?.find(
      item =>
        item.student_id ===
          state.student.id &&
        new Date(
          item.expires_at
        ) > new Date()
    );


  if (!restriction) {

    hide(restrictionNotice);

    return;
  }

  show(restrictionNotice);

  updateRestrictionCountdown(
    restriction.expires_at
  );
}


function startRestrictionWatcher() {

  clearInterval(
    state.restrictionTimer
  );

  state.restrictionTimer =
    setInterval(
      async () => {

        if (
          state.role !== "student"
        ) {
          return;
        }

        await loadRestrictions();

      },
      10000
    );
}


function updateRestrictionCountdown(
  expiresAt
) {

  const expires =
    new Date(expiresAt);

  const update = () => {

    const remaining =
      expires.getTime() -
      Date.now();

    if (remaining <= 0) {

      hide(restrictionNotice);

      return;
    }

    const seconds =
      Math.floor(
        remaining / 1000
      );

    const minutes =
      Math.floor(
        seconds / 60
      );

    const secs =
      seconds % 60;

    restrictionCountdown.textContent =
      `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  };

  update();

}


/* =========================================================
   LECTURER RESTRICTION
========================================================= */

async function restrictStudent(
  studentId,
  minutes
) {

  if (state.role !== "lecturer") {
    return;
  }

  const expiresAt =
    new Date(
      Date.now() +
      minutes * 60 * 1000
    );


  const {
    error
  } = await supabaseClient
    .from("restrictions")
    .insert({

      student_id: studentId,

      restricted_by:
        state.user.id,

      duration_minutes:
        minutes,

      expires_at:
        expiresAt.toISOString()

    });


  if (error) {

    console.error(
      "Restriction error:",
      error
    );

    showToast(
      "Unable to restrict student."
    );

    return;
  }

  showToast(
    `Student restricted for ${minutes} minutes.`
  );

  await loadRestrictions();

  renderLecturerStudents();

}


/* =========================================================
   REMOVE RESTRICTION
========================================================= */

async function removeRestriction(
  studentId
) {

  if (state.role !== "lecturer") {
    return;
  }

  const {
    error
  } = await supabaseClient
    .from("restrictions")
    .delete()
    .eq(
      "student_id",
      studentId
    );

  if (error) {

    console.error(
      error
    );

    showToast(
      "Unable to remove restriction."
    );

    return;
  }

  showToast(
    "Student restriction removed."
  );

  await loadRestrictions();

  renderLecturerStudents();
}


/* =========================================================
   LECTURER STUDENT LIST
========================================================= */

function renderLecturerStudents() {

  const container =
    $("#lecturerStudentsList");

  if (!container) return;

  container.innerHTML = "";


  state.students.forEach(
    student => {

      const restricted =
        state.restrictions?.some(
          restriction =>
            restriction.student_id ===
              student.id &&
            new Date(
              restriction.expires_at
            ) > new Date()
        );


      const participation =
        calculateResponseLevel(
          student.id
        );


      const row =
        document.createElement("div");

      row.className =
        "lecturer-student";


      const avatar =
        document.createElement("div");

      avatar.className =
        "student-avatar";

      avatar.style.background =
        student.color;

      avatar.textContent =
        getInitials(
          student.display_name
        );


      const info =
        document.createElement("div");

      info.className =
        "student-info";

      info.innerHTML = `
        <strong>
          ${escapeHTML(student.display_name)}
        </strong>

        <span>
          ${escapeHTML(student.student_id)}
        </span>
      `;


      const gauge =
        document.createElement("div");

      gauge.className =
        "gauge-section";

      gauge.innerHTML = `
        <div class="response-gauge">
          <div
            class="response-gauge-fill"
            style="
              width:${participation}%;
              background:${student.color};
            "
          ></div>
        </div>

        <span class="gauge-value">
          ${participation}%
        </span>
      `;


      const actions =
        document.createElement("div");

      actions.className =
        "student-actions";


      if (restricted) {

        const remove =
          document.createElement("button");

        remove.className =
          "small-button";

        remove.textContent =
          "Remove restriction";

        remove.onclick =
          () =>
            removeRestriction(
              student.id
            );

        actions.appendChild(
          remove
        );

      } else {

        const restrict =
          document.createElement("button");

        restrict.className =
          "small-button danger";

        restrict.textContent =
          "Restrict";

        restrict.onclick =
          () =>
            openRestrictionModal(
              student
            );

        actions.appendChild(
          restrict
        );
      }


      row.append(
        avatar,
        info,
        gauge,
        actions
      );

      container.appendChild(
        row
      );

    }
  );


  updateDashboardStats();
}


/* =========================================================
   RESPONSE GAUGE
========================================================= */

function calculateResponseLevel(
  studentId
) {

  const now =
    Date.now();

  const recentWindow =
    10 * 60 * 1000;

  const recentMessages =
    state.messages.filter(
      message =>
        message.student_id ===
          studentId &&
        now -
          new Date(
            message.created_at
          ).getTime() <=
          recentWindow
    );


  /*
    The gauge is based on recent
    participation, not lifetime
    message count.
  */

  const percentage =
    Math.min(
      recentMessages.length * 20,
      100
    );

  return percentage;
}


/* =========================================================
   STUDENT PARTICIPANTS
========================================================= */

function renderStudents() {

  if (!participantsList) {
    return;
  }

  participantsList.innerHTML = "";


  state.students.forEach(
    student => {

      const item =
        document.createElement("div");

      item.className =
        "participant";


      const avatar =
        document.createElement("div");

      avatar.className =
        "participant-avatar";

      avatar.style.background =
        student.color;

      avatar.textContent =
        getInitials(
          student.display_name
        );


      if (
        student.is_online
      ) {

        const online =
          document.createElement("span");

        online.className =
          "online-indicator";

        avatar.appendChild(
          online
        );

      }


      const info =
        document.createElement("div");

      info.className =
        "participant-info";

      info.innerHTML = `
        <strong>
          ${escapeHTML(student.display_name)}
        </strong>

        <span>
          ${escapeHTML(student.student_id)}
        </span>
      `;


      const status =
        document.createElement("span");

      status.className =
        "participant-status";

      status.textContent =
        student.is_online
          ? "Online"
          : "Offline";


      item.append(
        avatar,
        info,
        status
      );

      participantsList.appendChild(
        item
      );

    }
  );


  updateOnlineCount();
}


/* =========================================================
   REALTIME
========================================================= */

function setupRealtime() {

  if (state.subscription) {

    supabaseClient.removeChannel(
      state.subscription
    );

  }


  state.subscription =
    supabaseClient
      .channel(
        "classroom-live-chat"
      )

      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages"
        },
        async payload => {

          await handleNewMessage(
            payload.new
          );

        }
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "restrictions"
        },
        async () => {

          await loadRestrictions();

          if (
            state.role === "lecturer"
          ) {
            renderLecturerStudents();
          }

        }
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "students"
        },
        async () => {

          await loadStudents();

          renderStudents();

          if (
            state.role === "lecturer"
          ) {
            renderLecturerStudents();
          }

        }
      )

      .subscribe(
        status => {

          updateConnectionStatus(
            status
          );

        }
      );
}


/* =========================================================
   NEW MESSAGE
========================================================= */

async function handleNewMessage(
  message
) {

  /*
    Ignore duplicates.
  */

  if (
    state.messages.some(
      item =>
        item.id === message.id
    )
  ) {
    return;
  }


  const student =
    findStudent(
      message.student_id
    );

  if (!student) {

    await loadMessages();

  } else {

    state.messages.push({
      ...message,
      students: student
    });

  }


  renderMessages();

  updateDashboardStats();

  renderLecturerActivity();

}


/* =========================================================
   PRESENCE
========================================================= */

function setupPresence() {

  if (state.presenceChannel) {

    supabaseClient.removeChannel(
      state.presenceChannel
    );

  }


  state.presenceChannel =
    supabaseClient.channel(
      "classroom-presence"
    );


  state.presenceChannel
    .on(
      "presence",
      {
        event: "sync"
      },
      async () => {

        const stateData =
          state.presenceChannel
            .presenceState();

        state.onlineUsers =
          new Set(
            Object.keys(
              stateData
            )
          );

        updateOnlineCount();

      }
    )


    .on(
      "presence",
      {
        event: "join"
      },
      () => {

        updateOnlineCount();

      }
    )


    .on(
      "presence",
      {
        event: "leave"
      },
      () => {

        updateOnlineCount();

      }
    )


    .subscribe(
      async status => {

        if (
          status === "SUBSCRIBED"
        ) {

          const identity =
            state.user?.id;

          if (!identity) {
            return;
          }

          await state.presenceChannel.track({
            user_id: identity,
            role: state.role,
            student_id:
              state.student?.id || null
          });

        }

      }
    );
}


/* =========================================================
   ONLINE COUNT
========================================================= */

function updateOnlineCount() {

  const count =
    state.onlineUsers.size;


  if ($("#onlineCount")) {
    $("#onlineCount").textContent =
      count;
  }

  if ($("#participantCount")) {
    $("#participantCount").textContent =
      state.students.length;
  }

  if ($("#dashboardParticipants")) {
    $("#dashboardParticipants").textContent =
      state.students.length;
  }
}


/* =========================================================
   STUDENT ONLINE STATUS
========================================================= */

async function updateStudentOnlineStatus(
  online
) {

  if (
    !state.student
  ) {
    return;
  }

  const {
    error
  } = await supabaseClient
    .from("students")
    .update({
      is_online: online,
      last_seen:
        new Date().toISOString()
    })
    .eq(
      "id",
      state.student.id
    );

  if (error) {
    console.error(error);
  }
}


/* =========================================================
   DASHBOARD STATISTICS
========================================================= */

function updateDashboardStats() {

  if (!state.students) {
    return;
  }


  const active =
    state.students.filter(
      student =>
        student.is_online
    ).length;


  const restricted =
    state.restrictions?.filter(
      restriction =>
        new Date(
          restriction.expires_at
        ) > new Date()
    ).length || 0;


  if ($("#dashboardParticipants")) {
    $("#dashboardParticipants")
      .textContent =
      state.students.length;
  }

  if ($("#dashboardActive")) {
    $("#dashboardActive")
      .textContent =
      active;
  }

  if ($("#dashboardMessages")) {
    $("#dashboardMessages")
      .textContent =
      state.messages.length;
  }

  if ($("#dashboardRestricted")) {
    $("#dashboardRestricted")
      .textContent =
      restricted;
  }
}


/* =========================================================
   LECTURER ACTIVITY
========================================================= */

function renderLecturerActivity() {

  const container =
    $("#lecturerActivity");

  if (!container) {
    return;
  }

  container.innerHTML = "";


  const recent =
    [...state.messages]
      .sort(
        (a, b) =>
          new Date(b.created_at) -
          new Date(a.created_at)
      )
      .slice(0, 15);


  recent.forEach(
    message => {

      const student =
        message.students ||
        findStudent(
          message.student_id
        );

      if (!student) {
        return;
      }


      const item =
        document.createElement("div");

      item.className =
        "activity-item";


      item.innerHTML = `
        <span
          class="activity-dot"
          style="background:${student.color}"
        ></span>

        <div>

          <strong>
            ${escapeHTML(student.display_name)}
          </strong>

          <p>
            ${escapeHTML(
              truncate(
                message.message,
                90
              )
            )}
          </p>

          <time>
            ${formatTime(
              message.created_at
            )}
          </time>

        </div>
      `;


      container.appendChild(
        item
      );

    }
  );
}


/* =========================================================
   REACTIONS
========================================================= */

function openReactionPicker(
  event,
  messageId
) {

  state.selectedMessageId =
    messageId;

  reactionPicker.classList.remove(
    "hidden"
  );


  const rect =
    event.currentTarget.getBoundingClientRect();


  reactionPicker.style.left =
    `${rect.left}px`;

  reactionPicker.style.top =
    `${rect.top - 55}px`;
}


$$(
  "#reactionPicker button"
).forEach(
  button => {

    button.addEventListener(
      "click",
      async () => {

        const reaction =
          button.dataset.reaction;

        if (
          !state.selectedMessageId
        ) {
          return;
        }

        await addReaction(
          state.selectedMessageId,
          reaction
        );

        hide(reactionPicker);

      }
    );

  }
);


async function addReaction(
  messageId,
  reaction
) {

  if (!state.user) {
    return;
  }

  if (
    state.role === "student" &&
    !state.student
  ) {
    return;
  }


  const studentId =
    state.student?.id;


  if (!studentId) {

    showToast(
      "Reaction identity is not configured."
    );

    return;
  }


  const {
    error
  } = await supabaseClient
    .from("reactions")
    .insert({

      message_id: messageId,

      student_id: studentId,

      reaction

    });


  if (error) {

    if (
      error.code === "23505"
    ) {

      showToast(
        "You already used that reaction."
      );

    } else {

      console.error(error);

      showToast(
        "Reaction could not be added."
      );

    }

    return;
  }

  showToast(
    "Reaction added."
  );
}


/* =========================================================
   REPLY
========================================================= */

function setReply(
  message,
  student
) {

  state.replyTo = message;

  $("#replyAuthor")
    .textContent =
    student.display_name;

  $("#replyText")
    .textContent =
    truncate(
      message.message,
      100
    );

  show(
    $("#replyPreview")
  );

  messageInput.focus();
}


function clearReply() {

  state.replyTo = null;

  hide(
    $("#replyPreview")
  );
}


$("#cancelReply")
  ?.addEventListener(
    "click",
    clearReply
  );


/* =========================================================
   RESTRICTION MODAL
========================================================= */

function openRestrictionModal(
  student
) {

  state.selectedStudent =
    student;

  $("#restrictionStudentName")
    .textContent =
    `${student.display_name} (${student.student_id})`;

  show(
    restrictionModal
  );
}


function closeRestrictionModal() {

  state.selectedStudent =
    null;

  hide(
    restrictionModal
  );
}


$("#closeRestrictionModal")
  ?.addEventListener(
    "click",
    closeRestrictionModal
);


$$(
  ".restriction-option"
).forEach(
  button => {

    button.addEventListener(
      "click",
      async () => {

        if (
          !state.selectedStudent
        ) {
          return;
        }

        const minutes =
          Number(
            button.dataset.minutes
          );

        await restrictStudent(
          state.selectedStudent.id,
          minutes
        );

        closeRestrictionModal();

      }
    );

  }
);


/* =========================================================
   LOGIN TABS
========================================================= */

studentTab.addEventListener(
  "click",
  () => {

    studentTab.classList.add(
      "active"
    );

    lecturerTab.classList.remove(
      "active"
    );

    show(
      studentLoginForm
    );

    hide(
      lecturerLoginForm
    );

    clearLoginMessage();
  }
);


lecturerTab.addEventListener(
  "click",
  () => {

    lecturerTab.classList.add(
      "active"
    );

    studentTab.classList.remove(
      "active"
    );

    show(
      lecturerLoginForm
    );

    hide(
      studentLoginForm
    );

    clearLoginMessage();
  }
);


/* =========================================================
   LOGOUT
========================================================= */

$("#studentLogout")
  ?.addEventListener(
    "click",
    logout
  );

$("#lecturerLogout")
  ?.addEventListener(
    "click",
    logout
);


async function logout() {

  if (
    state.student
  ) {

    await updateStudentOnlineStatus(
      false
    );

  }


  await supabaseClient.auth.signOut();

  resetApplication();
}


/* =========================================================
   RESET
========================================================= */

function resetApplication() {

  if (
    state.subscription
  ) {

    supabaseClient.removeChannel(
      state.subscription
    );

  }

  if (
    state.presenceChannel
  ) {

    supabaseClient.removeChannel(
      state.presenceChannel
    );

  }


  clearInterval(
    state.restrictionTimer
  );


  state.user = null;
  state.role = null;
  state.student = null;
  state.room = null;

  state.students = [];
  state.messages = [];
  state.reactions = [];

  state.onlineUsers =
    new Set();


  hide(studentApp);
  hide(lecturerApp);

  show(loginScreen);

}


/* =========================================================
   CONNECTION STATUS
========================================================= */

function updateConnectionStatus(
  status
) {

  const element =
    $("#connectionStatus");

  if (!element) return;


  const label =
    element.querySelector(
      "span:last-child"
    );

  const dot =
    element.querySelector(
      ".status-dot"
    );


  if (
    status === "SUBSCRIBED"
  ) {

    if (label)
      label.textContent =
        "Connected";

    if (dot)
      dot.style.background =
        "#16a34a";

    state.reconnecting =
      false;

    return;
  }


  if (
    status === "CHANNEL_ERROR" ||
    status === "TIMED_OUT"
  ) {

    if (label)
      label.textContent =
        "Reconnecting...";

    if (dot)
      dot.style.background =
        "#d97706";

    state.reconnecting =
      true;

    recoverConnection();

  }
}


/* =========================================================
   MISSED MESSAGE RECOVERY
========================================================= */

async function recoverConnection() {

  if (
    state.reconnecting !== true
  ) {
    return;
  }

  /*
    Re-fetch the latest database
    state after a Realtime interruption.
  */

  try {

    await loadStudents();

    await loadMessages();

    await loadRestrictions();

    renderMessages();

    renderStudents();

    if (
      state.role === "lecturer"
    ) {

      renderLecturerStudents();

      renderLecturerActivity();

    }

    setupRealtime();

    state.reconnecting =
      false;

  } catch (error) {

    console.error(
      "Recovery failed:",
      error
    );

  }
}


/* =========================================================
   MESSAGE INPUT
========================================================= */

messageInput?.addEventListener(
  "input",
  () => {

    messageInput.style.height =
      "auto";

    messageInput.style.height =
      `${Math.min(
        messageInput.scrollHeight,
        120
      )}px`;

  }
);


/* =========================================================
   DOWNLOAD CHAT
========================================================= */

$("#downloadChatStudent")
  ?.addEventListener(
    "click",
    downloadTodaysChat
  );

$("#downloadChatLecturer")
  ?.addEventListener(
    "click",
    downloadTodaysChat
  );


async function downloadTodaysChat() {

  /*
    The database history is already
    persisted in public.messages.

    This V1 frontend creates a simple
    text export.

    A proper PDF generator can be added
    in the next step.
  */

  const today =
    new Date()
      .toISOString()
      .slice(0, 10);


  const todaysMessages =
    state.messages.filter(
      message =>
        new Date(
          message.created_at
        )
        .toISOString()
        .slice(0, 10) ===
        today
    );


  let output =
    `CLASSROOM LIVE CHAT\n`;

  output +=
    `Date: ${today}\n`;

  output +=
    `==============================\n\n`;


  todaysMessages.forEach(
    message => {

      const student =
        message.students ||
        findStudent(
          message.student_id
        );

      if (!student) return;

      output +=
        `${student.display_name} — `;

      output +=
        `${message.message}\n`;

      output +=
        `${formatTime(
          message.created_at
        )}\n\n`;

    }
  );


  const blob =
    new Blob(
      [output],
      {
        type: "text/plain"
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  const link =
    document.createElement("a");

  link.href = url;

  link.download =
    `classroom-chat-${today}.txt`;

  link.click();

  URL.revokeObjectURL(
    url
  );
}


/* =========================================================
   UI HELPERS
========================================================= */

function show(element) {

  if (element) {
    element.classList.remove(
      "hidden"
    );
  }
}


function hide(element) {

  if (element) {
    element.classList.add(
      "hidden"
    );
  }
}


function showLoginError(
  message
) {

  loginMessage.textContent =
    message;
}


function clearLoginMessage() {

  loginMessage.textContent =
    "";
}


function setLoginLoading(
  loading
) {

  const buttons =
    document.querySelectorAll(
      ".login-form button[type='submit']"
    );

  buttons.forEach(
    button => {

      button.disabled =
        loading;

      button.textContent =
        loading
          ? "Please wait..."
          : button.dataset.originalText ||
            button.textContent;

    }
  );
}


function showToast(
  message
) {

  toast.textContent =
    message;

  show(toast);

  clearTimeout(
    showToast.timer
  );

  showToast.timer =
    setTimeout(
      () => hide(toast),
      3000
    );
}


/* =========================================================
   UTILITIES
========================================================= */

function findStudent(
  studentId
) {

  return state.students.find(
    student =>
      student.id ===
      studentId
  );
}


function getInitials(
  name
) {

  return String(name)
    .split(" ")
    .map(
      part =>
        part.charAt(0)
    )
    .slice(0, 2)
    .join("")
    .toUpperCase();
}


function formatTime(
  timestamp
) {

  return new Date(
    timestamp
  ).toLocaleTimeString(
    [],
    {
      hour: "numeric",
      minute: "2-digit"
    }
  );
}


function truncate(
  text,
  length
) {

  if (
    String(text).length <= length
  ) {
    return String(text);
  }

  return (
    String(text).slice(0, length) +
    "..."
  );
}


function escapeHTML(
  value
) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function scrollMessagesToBottom() {

  if (!messagesContainer) {
    return;
  }

  messagesContainer.scrollTop =
    messagesContainer.scrollHeight;
}


/* =========================================================
   CLOSE REACTION PICKER
========================================================= */

document.addEventListener(
  "click",
  event => {

    if (
      !reactionPicker.contains(
        event.target
      ) &&
      !event.target.closest(
        ".message-action"
      )
    ) {

      hide(
        reactionPicker
      );

    }

  }
);


/* =========================================================
   INITIAL LOGIN BUTTON LABELS
========================================================= */

$$(
  ".login-form button[type='submit']"
).forEach(
  button => {

    button.dataset.originalText =
      button.textContent;

  }
);