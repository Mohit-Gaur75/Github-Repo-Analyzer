const { githubRequest, githubRequestSafe } = require("../utils/githubApi");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithRetry = async (endpoint, retries = 3, delayMs = 1500) => {
  for (let i = 0; i < retries; i++) {
    try {
      const data = await githubRequest(endpoint);
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
      if (data && typeof data === "object" && !Array.isArray(data) && Object.keys(data).length > 0) {
        return data;
      }
      await sleep(delayMs);
    } catch (error) {
      if (i === retries - 1) {
        console.warn(`Retry failed for ${endpoint}: ${error.message}`);
        return null;
      }
      await sleep(delayMs);
    }
  }
  return null;
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatHourLabel = (hour) => {
  const period = hour < 12 ? "AM" : "PM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour} ${period}`;
};

const computeCalendarHeatmap = (weeklyActivity) => {
  if (!Array.isArray(weeklyActivity) || weeklyActivity.length === 0) {
    return {
      weeks: [],
      monthLabels: [],
      streaks: { longestStreak: 0, currentStreak: 0, totalActiveDays: 0 },
      maxDailyCommits: 0,
      busiestDay: null,
      totalCommitsLastYear: 0
    };
  }

  // Find overall max daily commit to calculate quartile levels
  let maxDailyCommits = 0;
  weeklyActivity.forEach((w) => {
    if (Array.isArray(w.days)) {
      w.days.forEach((cnt) => {
        if (cnt > maxDailyCommits) maxDailyCommits = cnt;
      });
    }
  });

  const getLevel = (count) => {
    if (!count || count <= 0) return 0;
    if (maxDailyCommits <= 4) {
      return Math.min(count, 4);
    }
    const q1 = Math.max(1, Math.ceil(maxDailyCommits * 0.25));
    const q2 = Math.max(2, Math.ceil(maxDailyCommits * 0.5));
    const q3 = Math.max(3, Math.ceil(maxDailyCommits * 0.75));

    if (count <= q1) return 1;
    if (count <= q2) return 2;
    if (count <= q3) return 3;
    return 4;
  };

  const allDays = [];
  const weeks = weeklyActivity.map((w, weekIndex) => {
    const weekStartTs = (w.week || 0) * 1000;
    const days = (w.days || [0, 0, 0, 0, 0, 0, 0]).map((count, dayIndex) => {
      const dayTs = weekStartTs + dayIndex * 86400000;
      const dateObj = new Date(dayTs);
      const dateStr = dateObj.toISOString().split("T")[0];
      const dayData = {
        date: dateStr,
        dayIndex,
        dayName: DAY_NAMES[dayIndex],
        shortDay: SHORT_DAYS[dayIndex],
        count: count || 0,
        level: getLevel(count || 0)
      };
      allDays.push(dayData);
      return dayData;
    });

    return {
      weekIndex,
      weekStart: new Date(weekStartTs).toISOString().split("T")[0],
      total: w.total || 0,
      days
    };
  });

  // Calculate Month labels with column indices
  const monthLabels = [];
  let lastMonth = -1;
  weeks.forEach((w, idx) => {
    if (w.days && w.days.length > 0) {
      const monthIndex = new Date(w.days[0].date).getUTCMonth();
      if (monthIndex !== lastMonth) {
        monthLabels.push({
          month: MONTH_NAMES[monthIndex],
          weekIndex: idx
        });
        lastMonth = monthIndex;
      }
    }
  });

  // Calculate streaks
  let longestStreak = 0;
  let tempStreak = 0;
  let totalActiveDays = 0;
  let busiestDay = null;

  allDays.forEach((d) => {
    if (d.count > 0) {
      totalActiveDays++;
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
      if (!busiestDay || d.count > busiestDay.count) {
        busiestDay = d;
      }
    } else {
      tempStreak = 0;
    }
  });

  // Current streak (active up to the latest recorded day)
  let currentStreak = 0;
  let backIndex = allDays.length - 1;
  // If today is 0 commits but yesterday was active, consider streak unbroken
  if (backIndex >= 0 && allDays[backIndex].count === 0 && backIndex > 0 && allDays[backIndex - 1].count > 0) {
    backIndex--;
  }
  while (backIndex >= 0 && allDays[backIndex].count > 0) {
    currentStreak++;
    backIndex--;
  }

  const totalCommitsLastYear = weeklyActivity.reduce((sum, w) => sum + (w.total || 0), 0);

  return {
    weeks,
    monthLabels,
    streaks: {
      longestStreak,
      currentStreak,
      totalActiveDays
    },
    maxDailyCommits,
    busiestDay,
    totalCommitsLastYear
  };
};

const computePunchCard = (punchCardRaw, recentCommits) => {
  // Initialize 7 days x 24 hours matrix with 0s
  const matrix = Array.from({ length: 7 }, () => Array(24).fill(0));
  let hasData = false;

  if (Array.isArray(punchCardRaw) && punchCardRaw.length > 0) {
    punchCardRaw.forEach((row) => {
      if (Array.isArray(row) && row.length >= 3) {
        const [day, hour, count] = row;
        if (day >= 0 && day < 7 && hour >= 0 && hour < 24) {
          matrix[day][hour] = count;
          if (count > 0) hasData = true;
        }
      }
    });
  } else if (Array.isArray(recentCommits) && recentCommits.length > 0) {
    // Fallback: derive punch card from recent commits timestamps
    recentCommits.forEach((c) => {
      const dateStr = c?.commit?.author?.date || c?.date;
      if (dateStr) {
        const dateObj = new Date(dateStr);
        const day = dateObj.getUTCDay();
        const hour = dateObj.getUTCHours();
        if (day >= 0 && day < 7 && hour >= 0 && hour < 24) {
          matrix[day][hour] += 1;
          hasData = true;
        }
      }
    });
  }

  let totalPunchCommits = 0;
  let maxHourCommits = 0;

  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const val = matrix[d][h];
      totalPunchCommits += val;
      if (val > maxHourCommits) maxHourCommits = val;
    }
  }

  // Day totals (Sun..Sat)
  const dayTotals = DAY_NAMES.map((name, dayIndex) => {
    const commits = matrix[dayIndex].reduce((sum, val) => sum + val, 0);
    const percentage = totalPunchCommits > 0 ? parseFloat(((commits / totalPunchCommits) * 100).toFixed(1)) : 0;
    return {
      day: name,
      short: SHORT_DAYS[dayIndex],
      dayIndex,
      commits,
      percentage
    };
  });

  // Hour totals (0..23)
  const hourTotals = Array.from({ length: 24 }, (_, hour) => {
    let commits = 0;
    for (let d = 0; d < 7; d++) {
      commits += matrix[d][hour];
    }
    const percentage = totalPunchCommits > 0 ? parseFloat(((commits / totalPunchCommits) * 100).toFixed(1)) : 0;
    return {
      hour,
      label: formatHourLabel(hour),
      commits,
      percentage
    };
  });

  // Peak Day & Peak Hour
  const peakDay = dayTotals.reduce((max, d) => (d.commits > max.commits ? d : max), dayTotals[0]);
  const peakHour = hourTotals.reduce((max, h) => (h.commits > max.commits ? h : max), hourTotals[0]);

  // Time Blocks
  // Morning: 6am - 12pm (6..11)
  // Afternoon: 12pm - 6pm (12..17)
  // Evening: 6pm - 12am (18..23)
  // Late Night: 12am - 6am (0..5)
  const getBlockStats = (startH, endH, name, icon) => {
    let commits = 0;
    for (let h = startH; h <= endH; h++) {
      commits += hourTotals[h]?.commits || 0;
    }
    const percentage = totalPunchCommits > 0 ? parseFloat(((commits / totalPunchCommits) * 100).toFixed(1)) : 0;
    return { name, icon, startHour: startH, endHour: endH, commits, percentage };
  };

  const morning = getBlockStats(6, 11, "Morning (06:00 - 12:00)", "🌅");
  const afternoon = getBlockStats(12, 17, "Afternoon (12:00 - 18:00)", "☀️");
  const evening = getBlockStats(18, 23, "Evening (18:00 - 00:00)", "🌆");
  const lateNight = getBlockStats(0, 5, "Late Night (00:00 - 06:00)", "🌙");

  const timeBlocks = [morning, afternoon, evening, lateNight];
  const dominantBlock = timeBlocks.reduce((max, b) => (b.commits > max.commits ? b : max), timeBlocks[0]);

  // Weekend vs Weekday
  const weekdayCommits = dayTotals.slice(1, 6).reduce((sum, d) => sum + d.commits, 0);
  const weekendCommits = (dayTotals[0]?.commits || 0) + (dayTotals[6]?.commits || 0);
  const weekdayPct = totalPunchCommits > 0 ? parseFloat(((weekdayCommits / totalPunchCommits) * 100).toFixed(1)) : 0;
  const weekendPct = totalPunchCommits > 0 ? parseFloat(((weekendCommits / totalPunchCommits) * 100).toFixed(1)) : 0;

  let cadenceClassification = "⚖️ Balanced Continuous Development";
  let cadenceDescription = "Consistent, steady engineering activity distributed across the entire week.";

  if (weekdayPct >= 78) {
    cadenceClassification = "🏢 Corporate / Enterprise Cadence";
    cadenceDescription = `${weekdayPct}% of commits occur during standard weekday business hours, typical of enterprise software or sponsored open-source projects.`;
  } else if (weekendPct >= 35) {
    cadenceClassification = "🏖️ Weekend Warrior / Community Driven";
    cadenceDescription = `${weekendPct}% of commits land on weekends, showing high volunteer, community, or hobbyist participation.`;
  } else if (lateNight.percentage >= 28) {
    cadenceClassification = "🦉 Night Owl / Passion Project";
    cadenceDescription = `${lateNight.percentage}% of commits occur during late night hours (12 AM - 6 AM), typical of passionate nocturnal builders.`;
  }

  return {
    matrix,
    hasData,
    maxHourCommits: Math.max(maxHourCommits, 1),
    totalCommits: totalPunchCommits,
    dayTotals,
    hourTotals,
    peakDay,
    peakHour,
    timeBlocks,
    dominantBlock,
    cadence: {
      weekdayCommits,
      weekendCommits,
      weekdayPct,
      weekendPct,
      classification: cadenceClassification,
      description: cadenceDescription
    }
  };
};

exports.getCommitCalendar = async (owner, repo) => {
  const [commitActivity, punchCardRaw, recentCommits] = await Promise.all([
    fetchWithRetry(`/repos/${owner}/${repo}/stats/commit_activity`).catch(() => null),
    fetchWithRetry(`/repos/${owner}/${repo}/stats/punch_card`).catch(() => null),
    githubRequestSafe(`/repos/${owner}/${repo}/commits?per_page=30&page=1`)
  ]);

  const weeklyActivity = Array.isArray(commitActivity) ? commitActivity : [];
  const calendar = computeCalendarHeatmap(weeklyActivity);
  const punchCard = computePunchCard(punchCardRaw, recentCommits);

  return {
    calendar,
    punchCard,
    dataAvailable: calendar.weeks.length > 0 || punchCard.hasData
  };
};

exports.getCommits = async (owner, repo) => {
  try {
    const [commitActivity, punchCardRaw, recentCommits] = await Promise.all([
      fetchWithRetry(`/repos/${owner}/${repo}/stats/commit_activity`).catch(() => null),
      fetchWithRetry(`/repos/${owner}/${repo}/stats/punch_card`).catch(() => null),
      githubRequestSafe(`/repos/${owner}/${repo}/commits?per_page=30&page=1`)
    ]);

    const weeklyActivity = Array.isArray(commitActivity) ? commitActivity : [];

    const totalCommitsLastYear = weeklyActivity.reduce(
      (sum, week) => sum + (week?.total || 0),
      0
    );

    const monthlyActivity = {};
    weeklyActivity.forEach((week) => {
      if (week?.week) {
        const date = new Date(week.week * 1000);
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        monthlyActivity[monthKey] =
          (monthlyActivity[monthKey] || 0) + (week.total || 0);
      }
    });

    const recent = Array.isArray(recentCommits)
      ? recentCommits.map((commit) => ({
          sha: commit?.sha?.substring(0, 7) || "unknown",
          message: commit?.commit?.message?.split("\n")[0] || "No message",
          author:
            commit?.commit?.author?.name ||
            commit?.author?.login ||
            "Unknown",
          date: commit?.commit?.author?.date || null,
          url: commit?.html_url || null
        }))
      : [];

    const activeDays = weeklyActivity.reduce((sum, week) => {
      return (
        sum +
        (Array.isArray(week?.days)
          ? week.days.filter((day) => day > 0).length
          : 0)
      );
    }, 0);

    const mostActiveWeek =
      weeklyActivity.length > 0
        ? weeklyActivity.reduce(
            (max, week) =>
              (week?.total || 0) > (max?.total || 0) ? week : max,
            weeklyActivity[0]
          )
        : null;

    const calendar = computeCalendarHeatmap(weeklyActivity);
    const punchCard = computePunchCard(punchCardRaw, recentCommits);

    return {
      weeklyActivity,
      monthlyActivity,
      recentCommits: recent,
      totalCommitsLastYear,
      averageCommitsPerWeek:
        weeklyActivity.length > 0
          ? parseFloat(
              (totalCommitsLastYear / weeklyActivity.length).toFixed(2)
            )
          : 0,
      activeDays,
      mostActiveWeek,
      calendar,
      punchCard,
      dataAvailable: weeklyActivity.length > 0 || recent.length > 0 || punchCard.hasData
    };
  } catch (error) {
    console.error("Commit service error:", error.message);
    return {
      weeklyActivity: [],
      monthlyActivity: {},
      recentCommits: [],
      totalCommitsLastYear: 0,
      averageCommitsPerWeek: 0,
      activeDays: 0,
      mostActiveWeek: null,
      calendar: computeCalendarHeatmap([]),
      punchCard: computePunchCard(null, []),
      dataAvailable: false,
      error: error.message
    };
  }
};
