import { loadWeightChart, loadRecordsChart } from "./charts.js";
import { supabase } from "./supabase-config.js";

const loginSection = document.getElementById("loginSection");
const mainSection = document.getElementById("mainSection");
const welcome = document.getElementById("welcome");
const weightList = document.getElementById("weightList");

async function checkAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    showMainUI(session.user);
  } else {
    loginSection.classList.remove("hidden");
    mainSection.classList.add("hidden");
  }
}

supabase.auth.onAuthStateChange((_event, session) => {
  if (session) showMainUI(session.user);
  else {
    loginSection.classList.remove("hidden");
    mainSection.classList.add("hidden");
  }
});

async function showMainUI(user) {
  loginSection.classList.add("hidden");
  mainSection.classList.remove("hidden");
  welcome.innerText = `환영합니다, ${user.email}!`;

  const { data, error } = await supabase
    .from("players")
    .select("role")
    .eq("uid", user.id)
    .maybeSingle();

  if (error) {
    console.error("역할 불러오기 오류:", error.message);
    return;
  }

  if (!data) {
    console.warn("유저 역할 정보를 찾을 수 없습니다.");
    return;
  }

  const role = data.role;
  console.log("로그인 사용자 역할:", role);

  if (role === "superadmin") {
    document.getElementById("superAdminPanel").classList.remove("hidden");
  } else if (role === "admin") {
    document.getElementById("teamAdminPanel").classList.remove("hidden");
  } else {
    document.getElementById("playerPanel").classList.remove("hidden");
  }

  loadWeightChart(user);
  loadRecordsChart(user);
  loadProfileImage(user);
  loadWeightList(user);
}

async function signup() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const region = document.getElementById("region").value;
  const team = document.getElementById("team").value.trim();
  const name = document.getElementById("playerName").value.trim();

  if (!region || !team || !name) {
    return alert("시/도, 팀명, 선수 이름을 모두 입력하세요.");
  }

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return alert(error.message);

  await supabase.from("players").insert([
    {
      uid: data.user.id,
      email,
      region,
      team,
      name,
      role: "player"
    }
  ]);

  alert("회원가입 성공! 로그인해주세요.");
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) alert(error.message);
}

async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("로그아웃 실패:", error.message);
  } else {
    console.log("로그아웃 성공");
    loginSection.classList.remove("hidden");
    mainSection.classList.add("hidden");
  }
}

async function saveWeight() {
  const date = document.getElementById("weightDateInput").value;
  const weight = parseFloat(document.getElementById("weightInput").value);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || !date || !weight) return alert("날짜와 체중을 입력하세요.");

  await supabase.from("weights").insert([{ uid: session.user.id, date, weight }]);
  loadWeightChart(session.user);
  loadWeightList(session.user);
}

async function loadWeightList(user) {
  const { data, error } = await supabase
    .from("weights")
    .select("id, date, weight")
    .eq("uid", user.id)
    .order("date", { ascending: true });

  weightList.innerHTML = "";

  data.forEach(row => {
    const item = document.createElement("div");
    item.className = "accordion-item";
    item.innerHTML = `
      <button class="accordion-header">${row.date}</button>
      <div class="accordion-body">
        <p>체중: ${row.weight}kg</p>
        <button onclick="deleteWeight(${row.id})">삭제</button>
      </div>
    `;
    weightList.appendChild(item);
  });

  setTimeout(() => {
    document.querySelectorAll(".accordion-header").forEach(header => {
      header.addEventListener("click", () => {
        const body = header.nextElementSibling;
        const isOpen = body.style.display === "block";

        document.querySelectorAll(".accordion-body").forEach(b => b.style.display = "none");
        document.querySelectorAll(".accordion-header").forEach(h => h.classList.remove("active"));

        if (!isOpen) {
          body.style.display = "block";
          header.classList.add("active");
        }
      });
    });
  }, 100);
}

async function deleteWeight(id) {
  if (!confirm("정말 삭제하시겠습니까?")) return;
  await supabase.from("weights").delete().eq("id", id);
  const { data: { session } } = await supabase.auth.getSession();
  loadWeightChart(session.user);
  loadWeightList(session.user);
}

async function saveRecords() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const records = {
    snatch: parseFloat(document.getElementById("snatchInput").value || 0),
    cleanJerk: parseFloat(document.getElementById("cleanJerkInput").value || 0),
    backSquat: parseFloat(document.getElementById("backSquatInput").value || 0),
    frontSquat: parseFloat(document.getElementById("frontSquatInput").value || 0),
    deadlift: parseFloat(document.getElementById("deadliftInput").value || 0),
    benchPress: parseFloat(document.getElementById("benchPressInput").value || 0),
    uid: session.user.id
  };

  await supabase.from("records").upsert([records], { onConflict: ["uid"] });
  loadRecordsChart(session.user);
}

async function uploadProfileImage() {
  const file = document.getElementById("profileImageInput").files[0];
  const { data: { session } } = await supabase.auth.getSession();
  if (!file || !session) return;

  const { error } = await supabase.storage.from("profiles").upload(`${session.user.id}.jpg`, file, { upsert: true });
  if (error) return alert("업로드 실패: " + error.message);

  alert("프로필 이미지 업로드 완료!");
  loadProfileImage(session.user);
}

async function loadProfileImage(user) {
  const { data, error } = await supabase.storage
    .from("profiles")
    .getPublicUrl(`${user.id}.jpg`);

  const img = document.getElementById("profileImage");

  if (error || !data?.publicUrl) {
    console.error("이미지 불러오기 실패:", error?.message);
    img.src = "";
    return;
  }

  img.src = data.publicUrl;
}

async function deleteProfileImage() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  if (!confirm("프로필 사진을 삭제하시겠습니까?")) return;
  await supabase.storage.from("profiles").remove([`${session.user.id}.jpg`]);
  alert("프로필 이미지 삭제 완료!");
  document.getElementById("profileImage").src = "";
}

window.signup = signup;
window.login = login;
window.logout = logout;
window.saveWeight = saveWeight;
window.saveRecords = saveRecords;
window.uploadProfileImage = uploadProfileImage;
window.deleteProfileImage = deleteProfileImage;
window.deleteWeight = deleteWeight;

document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
});



