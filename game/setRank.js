function showRank() {
    // 读取并输出整个排行榜
    const rankList = selectAll();
    rankList.forEach(entry => console.log(entry));
}

function selectAll() {
    // 读取并返回整个排行榜
    const data = localStorage.getItem("rankList");
    return data ? JSON.parse(data) : [];
}

function ins2Rank(pname, kills) {
    // 插入新记录并更新排行榜
    const newEntry = [new Date(), pname, kills];
    let rankList = selectAll();

    // 添加新记录并重新排序
    rankList.push(newEntry);
    rankList.sort((a, b) => {
        const totalA = a[2];
        const totalB = b[2];
        return totalB - totalA || new Date(b[0]) - new Date(a[0]);
    });

    // 保留最多5条记录
    rankList = rankList.slice(0, 5);
    localStorage.setItem("rankList", JSON.stringify(rankList));
}

function clearRank() {
    localStorage.removeItem("rankList");
}

// 刷新排行榜内容
function refreshRank() {
    const rankList = selectAll();

    for (let i = 1; i <= 5; i++) {
        const player = rankList[i-1];
        const rankElement = document.querySelector(`.leaderboard-item:nth-child(${i})`);

        if (player) {
            document.getElementById(`p${i}`).textContent = player[1];
            document.getElementById(`d${i}`).textContent = formatDate(player[0]);
            document.getElementById(`k${i}`).textContent = formatNumber(player[2]);

        } else {
            // 没有记录时显示占位符
            document.getElementById(`p${i}`).textContent = '虚位以待';
            document.getElementById(`d${i}`).textContent = '--';
            document.getElementById(`k${i}`).textContent = '0';
        }
    }
}

// 格式化日期显示
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 格式化数字显示（添加千位分隔符）
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


export {showRank, ins2Rank, refreshRank};