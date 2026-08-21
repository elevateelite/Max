
<html lang="en">
<head>
  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, viewport-fit=cover"
  />

  <meta
    name="description"
    content="Classroom Live — real-time classroom discussion platform."
  />

  <meta name="theme-color" content="#0f172a" />

  <title>Classroom Live</title>

  <!-- PWA -->
  <link rel="manifest" href="manifest.json" />

  <!-- Google Font -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
    rel="stylesheet"
  />

  <!-- Main stylesheet -->
  <link rel="stylesheet" href="style.css" />

  <!-- Supabase -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>

<body>

  <!-- ==========================================
       APP
  =========================================== -->

  <div id="app">

    <!-- ========================================
         LOGIN SCREEN
    ========================================= -->

    <section id="loginScreen" class="screen login-screen">

      <div class="login-container">

        <div class="brand">

          <div class="brand-icon">
            💬
          </div>

          <h1>Classroom Live</h1>

          <p>
            Learn • Discuss • Connect
          </p>

        </div>


        <!-- LOGIN CARD -->

        <div class="login-card">

          <div class="login-tabs">

            <button
              id="studentTab"
              class="login-tab active"
              type="button"
            >
              Student
            </button>

            <button
              id="lecturerTab"
              class="login-tab"
              type="button"
            >
              Lecturer
            </button>

          </div>


          <!-- STUDENT LOGIN -->

          <form id="studentLoginForm" class="login-form">

            <div class="input-group">

              <label for="studentId">
                Student ID
              </label>

              <input
                id="studentId"
                type="text"
                placeholder="student01"
                autocomplete="username"
                required
              />

            </div>


            <div class="input-group">

              <label for="studentPassword">
                Password
              </label>

              <input
                id="studentPassword"
                type="password"
                placeholder="••••••••"
                autocomplete="current-password"
                required
              />

            </div>


            <button
              type="submit"
              class="primary-button"
            >
              Enter Class
            </button>

          </form>


          <!-- LECTURER LOGIN -->

          <form
            id="lecturerLoginForm"
            class="login-form hidden"
          >

            <div class="input-group">

              <label for="lecturerEmail">
                Lecturer Email
              </label>

              <input
                id="lecturerEmail"
                type="email"
                placeholder="lecturer@example.com"
                autocomplete="username"
                required
              />

            </div>


            <div class="input-group">

              <label for="lecturerPassword">
                Password
              </label>

              <input
                id="lecturerPassword"
                type="password"
                placeholder="••••••••"
                autocomplete="current-password"
                required
              />

            </div>


            <button
              type="submit"
              class="primary-button"
            >
              Lecturer Login
            </button>

          </form>


          <div
            id="loginMessage"
            class="login-message"
          ></div>

        </div>


        <div class="login-footer">
          <span>🔒 Secure classroom environment</span>
        </div>

      </div>

    </section>


    <!-- ==========================================
         STUDENT APPLICATION
    =========================================== -->

    <section
      id="studentApp"
      class="screen app-screen hidden"
    >

      <header class="topbar">

        <div class="topbar-brand">

          <div class="mini-brand-icon">
            💬
          </div>

          <div>
            <strong>Classroom Live</strong>
            <small id="studentRoomName">
              Live Classroom
            </small>
          </div>

        </div>


        <div class="topbar-actions">

          <div
            id="connectionStatus"
            class="connection-status"
          >
            <span class="status-dot"></span>
            <span>Connected</span>
          </div>

          <button
            id="studentLogout"
            class="icon-button"
            type="button"
            title="Logout"
          >
            ⇥
          </button>

        </div>

      </header>


      <!-- CHAT -->

      <main class="chat-layout">

        <div class="chat-main">

          <div class="chat-header">

            <div>

              <h2>
                Classroom Discussion
              </h2>

              <p>
                <span id="onlineCount">0</span>
                participants online
              </p>

            </div>

            <button
              id="downloadChatStudent"
              class="secondary-button"
              type="button"
            >
              Download Today's Chat
            </button>

          </div>


          <!-- RESTRICTION NOTICE -->

          <div
            id="restrictionNotice"
            class="restriction-notice hidden"
          >
            <strong>Participation restricted</strong>

            <span>
              You can participate again in
              <b id="restrictionCountdown">00:00</b>
            </span>
          </div>


          <!-- MESSAGES -->

          <div
            id="messagesContainer"
            class="messages-container"
          >

            <div
              id="emptyChat"
              class="empty-chat"
            >
              <div class="empty-chat-icon">
                💬
              </div>

              <h3>Welcome to the classroom</h3>

              <p>
                Start the discussion when you're ready.
              </p>
            </div>

          </div>


          <!-- TYPING INDICATOR -->

          <div
            id="typingIndicator"
            class="typing-indicator hidden"
          >
            Someone is typing...
          </div>


          <!-- MESSAGE COMPOSER -->

          <div class="composer-wrapper">

            <div
              id="replyPreview"
              class="reply-preview hidden"
            >

              <div>
                <small>Replying to</small>
                <strong id="replyAuthor"></strong>
                <p id="replyText"></p>
              </div>

              <button
                id="cancelReply"
                type="button"
              >
                ×
              </button>

            </div>


            <form
              id="messageForm"
              class="message-composer"
            >

              <button
                type="button"
                id="emojiButton"
                class="composer-button"
                title="Emoji"
              >
                😊
              </button>


              <textarea
                id="messageInput"
                rows="1"
                maxlength="2000"
                placeholder="Type your message..."
              ></textarea>


              <button
                type="submit"
                id="sendMessageButton"
                class="send-button"
              >
                ➤
              </button>

            </form>

          </div>

        </div>


        <!-- PARTICIPANTS -->

        <aside class="participants-panel">

          <div class="panel-header">

            <div>

              <h3>Participants</h3>

              <p>
                Live classroom
              </p>

            </div>

            <span id="participantCount">
              0
            </span>

          </div>


          <div
            id="participantsList"
            class="participants-list"
          ></div>

        </aside>

      </main>

    </section>


    <!-- ==========================================
         LECTURER APPLICATION
    =========================================== -->

    <section
      id="lecturerApp"
      class="screen app-screen hidden"
    >

      <header class="topbar lecturer-topbar">

        <div class="topbar-brand">

          <div class="mini-brand-icon">
            🎓
          </div>

          <div>
            <strong>Lecturer Control Center</strong>

            <small>
              Classroom Live
            </small>
          </div>

        </div>


        <div class="topbar-actions">

          <div class="connection-status">

            <span class="status-dot"></span>

            <span>
              Live
            </span>

          </div>

          <button
            id="lecturerLogout"
            class="icon-button"
            type="button"
          >
            ⇥
          </button>

        </div>

      </header>


      <main class="lecturer-dashboard">

        <!-- STATISTICS -->

        <div class="dashboard-stats">

          <div class="stat-card">

            <span class="stat-icon">
              👥
            </span>

            <div>
              <small>Participants</small>
              <strong id="dashboardParticipants">
                0
              </strong>
            </div>

          </div>


          <div class="stat-card">

            <span class="stat-icon">
              🟢
            </span>

            <div>
              <small>Active</small>
              <strong id="dashboardActive">
                0
              </strong>
            </div>

          </div>


          <div class="stat-card">

            <span class="stat-icon">
              💬
            </span>

            <div>
              <small>Messages</small>
              <strong id="dashboardMessages">
                0
              </strong>
            </div>

          </div>


          <div class="stat-card">

            <span class="stat-icon">
              🔒
            </span>

            <div>
              <small>Restricted</small>
              <strong id="dashboardRestricted">
                0
              </strong>
            </div>

          </div>

        </div>


        <!-- DASHBOARD GRID -->

        <div class="dashboard-grid">


          <!-- PARTICIPANTS -->

          <div class="dashboard-card participants-card">

            <div class="dashboard-card-header">

              <div>

                <h2>
                  Student Participation
                </h2>

                <p>
                  Monitor live classroom activity
                </p>

              </div>


              <button
                id="refreshStudents"
                class="secondary-button"
                type="button"
              >
                Refresh
              </button>

            </div>


            <div
              id="lecturerStudentsList"
              class="lecturer-students-list"
            ></div>

          </div>


          <!-- ACTIVITY -->

          <div class="dashboard-card activity-card">

            <div class="dashboard-card-header">

              <div>

                <h2>
                  Classroom Activity
                </h2>

                <p>
                  Recent discussion activity
                </p>

              </div>

            </div>


            <div
              id="lecturerActivity"
              class="activity-list"
            ></div>

          </div>

        </div>


        <!-- PDF EXPORT -->

        <div class="dashboard-card export-card">

          <div>

            <h2>
              Chat History
            </h2>

            <p>
              Export the classroom's text conversation.
              Shared files are excluded.
            </p>

          </div>


          <button
            id="downloadChatLecturer"
            class="primary-button"
            type="button"
          >
            📄 Download Today's Chat
          </button>

        </div>

      </main>

    </section>

  </div>


  <!-- ==========================================
       REACTION PICKER
  =========================================== -->

  <div
    id="reactionPicker"
    class="reaction-picker hidden"
  >

    <button data-reaction="👍">👍</button>
    <button data-reaction="❤️">❤️</button>
    <button data-reaction="😂">😂</button>
    <button data-reaction="😮">😮</button>
    <button data-reaction="👏">👏</button>
    <button data-reaction="🔥">🔥</button>
    <button data-reaction="💡">💡</button>
    <button data-reaction="🎯">🎯</button>

  </div>


  <!-- ==========================================
       RESTRICTION MODAL
  =========================================== -->

  <div
    id="restrictionModal"
    class="modal hidden"
  >

    <div class="modal-overlay"></div>

    <div class="modal-card">

      <button
        id="closeRestrictionModal"
        class="modal-close"
        type="button"
      >
        ×
      </button>

      <div class="modal-icon">
        🔒
      </div>

      <h2>
        Restrict Student
      </h2>

      <p>
        Choose how long this student should be
        prevented from sending messages.
      </p>

      <div
        id="restrictionStudentName"
        class="selected-student"
      ></div>


      <div class="restriction-options">

        <button
          class="restriction-option"
          data-minutes="15"
          type="button"
        >
          <strong>15</strong>
          <span>Minutes</span>
        </button>

        <button
          class="restriction-option"
          data-minutes="20"
          type="button"
        >
          <strong>20</strong>
          <span>Minutes</span>
        </button>

        <button
          class="restriction-option"
          data-minutes="30"
          type="button"
        >
          <strong>30</strong>
          <span>Minutes</span>
        </button>

      </div>

    </div>

  </div>


  <!-- ==========================================
       TOAST
  =========================================== -->

  <div
    id="toast"
    class="toast hidden"
  ></div>


  <!-- ==========================================
       JAVASCRIPT
  =========================================== -->

  <script src="app.js"></script>

</body>
</html>
