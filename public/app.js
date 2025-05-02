import { loadWeightChart, loadRecordsChart } from "./charts.js";
import { supabase } from "./supabase-config.js";

const loginSection = document.getElementById("loginSection");
const mainSection = document.getElementById("mainSection");
const welcome = document.getElementById("welcome");
const weightList = document.getElementById("weightList");

// 인증 상태 확인
async function checkAuth() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    showMainUI(session.user);
  } else {
    loginSection.classList.remove("hidden");
    mainSection.classList.add("hidden");
  }
}

// 인증 상태 변경 감지
supabase.auth.onAuthStateChange((_event, session) => {
  if (session) {
    showMainUI(session.user);
  } else {
    loginSection.classList.remove("hidden");
    mainSection.classList.add("hidden");
  }
});

// UI 표시
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

  if (role === "superadmin") {
    document.getElementById("superAdminPanel").classList.remove("hidden");
    loadPendingAdmins(); // 🔥 여기서 관리자 승인 목록 로드!
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



// 회원가입
async function signup() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const region = document.getElementById("region").value;
  const team = document.getElementById("team").value.trim();
  const name = document.getElementById("playerName").value.trim();
  const pendingAdmin = document.getElementById("adminRequestCheckbox").checked;

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
      role: "player",           // 기본 역할은 선수
      pendingAdmin: pendingAdmin // 체크박스 상태 반영
    },
  ]);
  if (insertError) {
    console.error("플레이어 등록 오류:", insertError.message); // 🔍 오류 확인
    return alert("회원 정보 저장 실패: " + insertError.message);
  }
  alert("회원가입 성공! 로그인해주세요.");
}


// 로그인
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) alert(error.message);
}

// 로그아웃
async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("로그아웃 실패:", error.message);
  } else {
    loginSection.classList.remove("hidden");
    mainSection.classList.add("hidden");
  }
}

// 체중 저장
async function loadWeightList(user) {
  const { data, error } = await supabase
    .from("weights")
    .select("id, date, weight")
    .eq("uid", user.id)
    .order("date", { ascending: true });

  if (error) {
    console.error("체중 목록 불러오기 실패:", error.message);
    return;
  }

  weightList.innerHTML = "";

  data.forEach(row => {
    const item = document.createElement("div");
    item.className = "accordion-item";

    const weightValue = row.weight !== null && row.weight !== undefined ? `${row.weight}kg` : "기록 없음";

    item.innerHTML = `
      <button class="accordion-header">${row.date}</button>
      <div class="accordion-body">
        <p>체중: ${weightValue}</p>
        <button onclick="deleteWeight(${row.id})">삭제</button>
      </div>
    `;

    weightList.appendChild(item);
  });

  bindAccordionEvents();
}





// 체중 삭제
async function deleteWeight(id) {
  console.log("🧹 삭제 요청됨, id:", id);
  if (!confirm("정말 삭제하시겠습니까?")) return;
  await supabase.from("weights").delete().eq("id", id);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  loadWeightChart(session.user);
  loadWeightList(session.user);
}

// 기록 저장
async function saveRecords() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  const records = {
    snatch: parseFloat(document.getElementById("snatchInput").value || 0),
    cleanJerk: parseFloat(document.getElementById("cleanJerkInput").value || 0),
    backSquat: parseFloat(document.getElementById("backSquatInput").value || 0),
    frontSquat: parseFloat(document.getElementById("frontSquatInput").value || 0),
    deadlift: parseFloat(document.getElementById("deadliftInput").value || 0),
    benchPress: parseFloat(document.getElementById("benchPressInput").value || 0),
    uid: session.user.id,
  };

  await supabase.from("records").upsert([records], { onConflict: ["uid"] });
  loadRecordsChart(session.user);
}
async function loadPendingAdmins() {
  const { data, error } = await supabase
    .from("players")
    .select("uid, name, email, team, region")
    .eq("pendingAdmin", true);

  if (error) {
    console.error("신청 목록 오류:", error.message);
    return;
  }

  const container = document.getElementById("adminRequests");
  container.innerHTML = "";

  if (data.length === 0) {
    container.innerHTML = "<p>현재 승인 대기 중인 신청자가 없습니다.</p>";
    return;
  }

  data.forEach(user => {
    const div = document.createElement("div");
    div.innerHTML = `
      <p><strong>${user.name}</strong> (${user.email})<br>
      팀: ${user.team}, 지역: ${user.region}<br>
      <button onclick="approveAdmin('${user.uid}')">✅ 승인</button>
      </p><hr>
    `;
    container.appendChild(div);
  });
}

// 이미지 업로드
async function uploadProfileImage() {
  const file = document.getElementById("profileImageInput").files[0];
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!file || !session) return;

  const { error } = await supabase.storage.from("profiles").upload(`${session.user.id}.jpg`, file, { upsert: true });
  if (error) return alert("업로드 실패: " + error.message);

  alert("프로필 이미지 업로드 완료!");
  loadProfileImage(session.user);
}

// 이미지 불러오기
async function loadProfileImage(user) {
  const { data, error } = await supabase.storage.from("profiles").getPublicUrl(`${user.id}.jpg`);
  const img = document.getElementById("profileImage");

  if (error || !data?.publicUrl) {
    console.error("이미지 불러오기 실패:", error?.message);
    img.src = "";
    return;
  }

  img.src = data.publicUrl;
}

// 이미지 삭제
async function deleteProfileImage() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  if (!confirm("프로필 사진을 삭제하시겠습니까?")) return;
  await supabase.storage.from("profiles").remove([`${session.user.id}.jpg`]);
  alert("프로필 이미지 삭제 완료!");
  document.getElementById("profileImage").src = "";
}

function bindAccordionEvents() {
  const headers = document.querySelectorAll(".accordion-header");

  headers.forEach(header => {
    header.addEventListener("click", () => {
      const body = header.nextElementSibling;

      // 보호 코드: body가 없거나 클래스 없으면 종료
      if (!body || !body.classList.contains("accordion-body")) return;

      const isOpen = header.classList.contains("active");

      // 모두 닫기
      document.querySelectorAll(".accordion-body").forEach(b => b.style.display = "none");
      document.querySelectorAll(".accordion-header").forEach(h => h.classList.remove("active"));

      // 클릭한 것만 열기
      if (!isOpen) {
        body.style.display = "block";
        header.classList.add("active");
      }
    });
  });
}
bindAccordionEvents();

async function saveWeight() {
  const date = document.getElementById("weightDateInput").value;
  const weight = parseFloat(document.getElementById("weightInput").value);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session || !date || !weight) {
    alert("날짜와 체중을 모두 입력하세요.");
    return;
  }

  const { error } = await supabase.from("weights").insert([
    {
      uid: session.user.id,
      date,
      weight,
    },
  ]);

  if (error) {
    console.error("체중 저장 오류:", error.message);
    alert("체중 저장 실패");
  } else {
    alert("체중이 저장되었습니다!");
    loadWeightChart(session.user);
    loadWeightList(session.user);
  }
}
window.saveWeight = saveWeight;

async function approveAdmin(uid) {
  const { error } = await supabase
    .from("players")
    .update({ role: "admin", pendingAdmin: false })
    .eq("uid", uid);

  if (error) {
    console.error("승인 실패:", error.message);
    alert("승인 중 오류 발생");
    return;
  }

  alert("관리자 승인이 완료되었습니다.");
  location.reload(); // 새로고침하여 목록 갱신
}

// 전역 연결
window.signup = signup;
window.login = login;
window.logout = logout;
window.saveWeight = saveWeight;
window.saveRecords = saveRecords;
window.uploadProfileImage = uploadProfileImage;
window.deleteProfileImage = deleteProfileImage;
window.deleteWeight = deleteWeight;
window.approveAdmin = approveAdmin;

document.addEventListener("DOMContentLoaded", () => {
  checkAuth();

  const toggleBtn = document.getElementById("toggleAllAccordionBtn");

if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    const allItems = document.querySelectorAll(".accordion-item");

    // 모두 보이는 상태인가?
    const isAllVisible = Array.from(allItems).every(item =>
      item.style.display !== "none"
    );

    if (isAllVisible) {
      // 모두 숨김
      allItems.forEach(item => (item.style.display = "none"));
      toggleBtn.textContent = "전체 펼치기";
    } else {
      // 모두 보이게
      allItems.forEach(item => (item.style.display = "block"));
      toggleBtn.textContent = "전체 접기";
    }
  });
}

});

  






