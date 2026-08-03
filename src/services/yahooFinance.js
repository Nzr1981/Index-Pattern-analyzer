export async function getIndexData(indexName, date) {
  const url = `/api/index?indexName=${encodeURIComponent(indexName)}&date=${date}`;

  console.log("Fetching:", url);

  const response = await fetch(url);

  const data = await response.json();

  console.log("Received:", data);

  return data;
}