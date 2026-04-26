import fetch from 'node-fetch';

async function test() {
  const url = "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFdPOERc1H33iokpp7j3HtbCxdW-bQ9pV5_RCW4M2IP4-CiNUyGF1Ar5HN7diKs8mJUPE3vBOwtsa5UHAMvvHZ0ldfjFI1CoTgzhqWd-CQcTGvLM-2YUJMRcNBOeYa9kJ-GiLEsU5QtUDoE9KtMt55kbs5VRHSw_vII3mvUq9dSDlal";
  
  try {
    const res = await fetch(url, { redirect: 'manual' });
    console.log("Status:", res.status);
    console.log("Headers:", res.headers.raw());
    console.log("Location:", res.headers.get('location'));
  } catch (e) {
    console.error(e);
  }
}
test();
