var USERS_BY_PIN = {
  "adminpin": { name: "Nume Admin", role: "admin" },

  "elev1": { name: "Buzdugan Matei", role: "elev" },   
  "elev2": { name: "Călin Andrei", role: "elev" },   
  "elev3": { name: "Cioineag Cristian", role: "elev" },   
  "elev4": { name: "Cojoc Otilia", role: "elev" },   
  "elev5": { name: "Crețu Daniel", role: "elev" },   
  "elev6": { name: "Drăgan Gabriel", role: "elev" },   
  "elev7": { name: "Drăgușan Eduard", role: "elev" },   
  "elev8": { name: "Enache Andrei", role: "elev" },   
  "elev9": { name: "Gabur Davide", role: "elev" },   
  "elev10": { name: "Giurgiu Beatrice", role: "elev" },   
  "elev11": { name: "Grădinariu Gabriel", role: "elev" },   
  "elev12": { name: "Helgiu Mihail", role: "elev" },   
  "elev13": { name: "Hogea Mihnea", role: "elev" },   
  "elev14": { name: "Ionel Dragoș", role: "elev" },   
  "elev15": { name: "Isciuc Theodor", role: "elev" },   
  "elev16": { name: "Luchian Toni", role: "elev" },   
  "elev17": { name: "Melinte Ștefana", role: "elev" },   
  "elev18": { name: "Mitria Dragoș", role: "elev" },   
  "elev19": { name: "Panainte Silviu", role: "elev" },   
  "elev20": { name: "Pantază Vladimir", role: "elev" },   
  "elev21": { name: "Panțiru Leonardo", role: "elev" },   
  "elev22": { name: "Sabin Octavian", role: "elev" },   
  "elev23": { name: "State Vlad", role: "elev" },   
  "elev24": { name: "Stoica Alexandru", role: "elev" },   
  "elev25": { name: "Șerban Matei", role: "elev" },   
  "elev26": { name: "Tihenea Andrei", role: "elev" },   
  "elev27": { name: "Tudosă Rareș", role: "elev" },   
  "elev28": { name: "Țăranu Teona", role: "elev" },   
  "elev29": { name: "Vasiliu Ciprian", role: "elev" },   
  "elev30": { name: "Zavada Mihai", role: "elev" }
};

var questions = [];
var selectedQuestionIndex = -1;

var currentUser = {
  name: "",
  role: "guest"
};

function saveCurrentUser() {
  try {
    sessionStorage.setItem("ask4cni_user", JSON.stringify(currentUser));
  } catch (e) {
    console.log("Nu pot salva userul în sessionStorage:", e);
  }
}

function loadCurrentUser() {
  try {
    var data = sessionStorage.getItem("ask4cni_user");
    if (data) {
      var u = JSON.parse(data);
      if (u && u.name && u.role) {
        currentUser = u;
      }
    }
  } catch (e) {
    console.log("Nu pot citi userul din sessionStorage:", e);
  }
}

function updateLoginUI() {
  if (currentUser.role !== "guest" && currentUser.name) {
    loginInfo.textContent = "Logat ca " + currentUser.name + " (" + currentUser.role + ")";
    logoutBtn.style.display = "inline-block";
  } else {
    loginInfo.textContent = "";
    logoutBtn.style.display = "none";
  }
}

var loginNameInput = document.getElementById("loginName");
var loginPinInput = document.getElementById("loginPin");
var loginBtn = document.getElementById("loginBtn");
var logoutBtn = document.getElementById("logoutBtn");
var loginInfo = document.getElementById("loginInfo");

var questionForm = document.getElementById("questionForm");
var questionsList = document.getElementById("questionsList");

var questionDetail = document.getElementById("questionDetail");
var answersList = document.getElementById("answersList");

var answerForm = document.getElementById("answerForm");
var answerBody = document.getElementById("aBody");

loadCurrentUser();
updateLoginUI();

loginBtn.addEventListener("click", function () {
  var pin = loginPinInput.value.trim().toLowerCase();
  var profName = loginNameInput.value.trim();

  if (pin === "") {
    alert("Introdu un PIN.");
    return;
  }

  if (pin === "prof2025") {
    if (profName === "") {
      alert("Profesorii trebuie să își scrie numele.");
      return;
    }
    currentUser.name = profName;
    currentUser.role = "profesor";
  } else {
    var user = USERS_BY_PIN[pin];
    if (!user) {
      alert("PIN invalid.");
      return;
    }
    currentUser.name = user.name;
    currentUser.role = user.role;
  }

  loginPinInput.value = "";
  loginNameInput.value = "";

  saveCurrentUser();
  updateLoginUI();
});

logoutBtn.addEventListener("click", function () {
  currentUser.name = "";
  currentUser.role = "guest";
  saveCurrentUser();
  updateLoginUI();
});

function startQuestionsListener() {
  db.collection("questions")
    .orderBy("createdAt", "asc")
    .onSnapshot(function (snapshot) {
      questions = [];
      snapshot.forEach(function (doc) {
        var data = doc.data();
        data.id = doc.id;
        if (!data.answers) data.answers = [];
        questions.push(data);
      });

      if (selectedQuestionIndex >= questions.length) {
        selectedQuestionIndex = questions.length - 1;
      }

      renderQuestions();
      renderDetail();
    });
}

questionForm.addEventListener("submit", function (e) {
  e.preventDefault();

  if (currentUser.role === "guest") {
    alert("Trebuie să fii logat.");
    return;
  }

  var title = document.getElementById("qTitle").value.trim();
  var subject = document.getElementById("qSubject").value.trim();
  var text = document.getElementById("qBody").value.trim();

  if (title === "" || subject === "" || text === "") {
    alert("Completează toate câmpurile.");
    return;
  }

  var q = {
    title: title,
    subject: subject,
    text: text,
    author: currentUser.name,
    answers: [],
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  db.collection("questions").add(q)
    .then(function () {
      document.getElementById("qTitle").value = "";
      document.getElementById("qSubject").value = "";
      document.getElementById("qBody").value = "";
    })
    .catch(function (err) {
      console.log("Eroare la adăugare întrebare:", err);
      alert("A apărut o eroare, încearcă din nou.");
    });
});

function renderQuestions() {
  questionsList.innerHTML = "";

  if (questions.length === 0) {
    var li = document.createElement("li");
    li.textContent = "Nu există întrebări încă.";
    questionsList.appendChild(li);
    return;
  }

  for (var i = 0; i < questions.length; i++) {
    var q = questions[i];
    var li = document.createElement("li");

    var textSpan = document.createElement("span");
    textSpan.textContent = q.title + " - " + q.author;

    var subjSpan = document.createElement("span");
    subjSpan.className = "materia";
    subjSpan.textContent = q.subject;

    li.appendChild(textSpan);
    li.appendChild(subjSpan);

    li.setAttribute("data-i", i);
    li.addEventListener("click", function () {
      selectedQuestionIndex = parseInt(this.getAttribute("data-i"));
      renderDetail();
    });

    questionsList.appendChild(li);
  }
}

function renderDetail() {
  questionDetail.innerHTML = "";
  answersList.innerHTML = "";

  if (selectedQuestionIndex < 0 || selectedQuestionIndex >= questions.length) {
    questionDetail.innerHTML = "<p>Alege o întrebare din stânga.</p>";
    return;
  }

  var q = questions[selectedQuestionIndex];

  var t = document.createElement("p");
  t.innerHTML = "<strong>" + q.title + "</strong>";
  questionDetail.appendChild(t);

  var s = document.createElement("p");
  s.textContent = "Materia: " + q.subject;
  questionDetail.appendChild(s);

  var tx = document.createElement("p");
  tx.textContent = q.text;
  questionDetail.appendChild(tx);

  var au = document.createElement("p");
  au.textContent = "Întrebare pusă de " + q.author;
  au.className = "meta";
  questionDetail.appendChild(au);

  if (currentUser.role === "admin") {
    var delQBtn = document.createElement("button");
    delQBtn.textContent = "Șterge întrebarea";
    delQBtn.className = "deleteBtn";
    delQBtn.type = "button";
    delQBtn.addEventListener("click", function () {
      deleteQuestion(selectedQuestionIndex);
    });
    questionDetail.appendChild(delQBtn);
  }

  if (q.answers.length === 0) {
    var p = document.createElement("p");
    p.textContent = "Nu există răspunsuri încă.";
    answersList.appendChild(p);
  } else {
    for (var i = 0; i < q.answers.length; i++) {
      var ans = q.answers[i];
      var div = document.createElement("div");
      div.className = "answer";

      var textDiv = document.createElement("div");
      textDiv.textContent = ans.text;
      div.appendChild(textDiv);

      var meta = document.createElement("div");
      meta.className = "meta";
      var metaText = "Răspuns de " + ans.author;

      if (ans.approvedBy) {
        metaText += " (bifat de " + ans.approvedBy + ")";
      }

      meta.textContent = metaText;
      div.appendChild(meta);

      if (ans.teacherComment) {
        var comm = document.createElement("div");
        comm.className = "teacherComment";
        var autorComm = ans.commentAuthor ? (" (" + ans.commentAuthor + ")") : "";
        comm.textContent = "Comentariu profesor" + autorComm + ": " + ans.teacherComment;
        div.appendChild(comm);
      }

      if (currentUser.role === "profesor" || currentUser.role === "admin") {
        var btns = document.createElement("div");
        btns.className = "answerButtons";

        var label = document.createElement("label");
        label.className = "checkLabel";
        var check = document.createElement("input");
        check.type = "checkbox";
        check.checked = !!ans.approvedBy;
        check.addEventListener("change", toggleApproval(selectedQuestionIndex, i));
        label.appendChild(check);
        var spanText = document.createElement("span");
        spanText.textContent = " Bifează acest răspuns";
        label.appendChild(spanText);
        btns.appendChild(label);

        var cBtn = document.createElement("button");
        cBtn.type = "button";
        cBtn.textContent = "Comentariu profesor";
        cBtn.addEventListener("click", setTeacherComment(selectedQuestionIndex, i));
        btns.appendChild(cBtn);

        if (currentUser.role === "admin") {
          var delAnsBtn = document.createElement("button");
          delAnsBtn.type = "button";
          delAnsBtn.textContent = "Șterge răspuns";
          delAnsBtn.className = "deleteBtn";
          delAnsBtn.addEventListener("click", deleteAnswer(selectedQuestionIndex, i));
          btns.appendChild(delAnsBtn);
        }

        div.appendChild(btns);
      }

      answersList.appendChild(div);
    }
  }
}

function setTeacherComment(qIndex, aIndex) {
  return function () {
    if (currentUser.role !== "profesor" && currentUser.role !== "admin") {
      alert("Doar profesorii sau adminul pot lăsa comentarii.");
      return;
    }

    var text = prompt("Scrie comentariul profesorului:");
    if (text === null) return;
    text = text.trim();

    var q = questions[qIndex];
    if (!q) return;
    if (!q.answers) q.answers = [];

    if (!q.answers[aIndex]) return;

    if (text === "") {
      q.answers[aIndex].teacherComment = "";
      q.answers[aIndex].commentAuthor = "";
    } else {
      q.answers[aIndex].teacherComment = text;
      q.answers[aIndex].commentAuthor = currentUser.name;
    }

    db.collection("questions").doc(q.id).update({
      answers: q.answers
    }).catch(function (err) {
      console.log("Eroare la salvarea comentariului:", err);
    });
  };
}

function toggleApproval(qIndex, aIndex) {
  return function (event) {
    if (currentUser.role !== "profesor" && currentUser.role !== "admin") {
      alert("Doar profesorii sau adminul pot bifa răspunsurile.");
      event.target.checked = false;
      return;
    }

    var q = questions[qIndex];
    if (!q || !q.answers || !q.answers[aIndex]) return;

    if (event.target.checked) {
      q.answers[aIndex].approvedBy = currentUser.name;
    } else {
      q.answers[aIndex].approvedBy = "";
    }

    db.collection("questions").doc(q.id).update({
      answers: q.answers
    }).catch(function (err) {
      console.log("Eroare la actualizare bifa:", err);
    });
  };
}

function deleteQuestion(index) {
  var q = questions[index];
  if (!q) return;
  if (!confirm("Sigur vrei să ștergi această întrebare?")) return;

  db.collection("questions").doc(q.id).delete()
    .catch(function (err) {
      console.log("Eroare la ștergere întrebare:", err);
    });

  selectedQuestionIndex = -1;
}

function deleteAnswer(qIndex, aIndex) {
  return function () {
    if (!confirm("Sigur vrei să ștergi acest răspuns?")) return;

    var q = questions[qIndex];
    if (!q) return;
    if (!q.answers) q.answers = [];

    q.answers.splice(aIndex, 1);

    db.collection("questions").doc(q.id).update({
      answers: q.answers
    }).catch(function (err) {
      console.log("Eroare la ștergere răspuns:", err);
    });
  };
}

answerForm.addEventListener("submit", function (e) {
  e.preventDefault();

  if (currentUser.role === "guest") {
    alert("Trebuie să fii logat.");
    return;
  }

  if (selectedQuestionIndex < 0 || selectedQuestionIndex >= questions.length) {
    alert("Alege o întrebare mai întâi.");
    return;
  }

  var text = answerBody.value.trim();
  if (text === "") {
    alert("Scrie un răspuns.");
    return;
  }

  var q = questions[selectedQuestionIndex];
  if (!q.answers) q.answers = [];

  var ans = {
    text: text,
    author: currentUser.name,
    teacherComment: "",
    commentAuthor: "",
    approvedBy: ""
  };

  q.answers.push(ans);
  answerBody.value = "";

  db.collection("questions").doc(q.id).update({
    answers: q.answers
  }).catch(function (err) {
    console.log("Eroare la adăugare răspuns:", err);
  });
});

startQuestionsListener();
renderQuestions();
renderDetail();
