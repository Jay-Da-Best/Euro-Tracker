async function add(id) {
    val = document.getElementById(`score-${id}`).value;
    const url = 'http://localhost:3000/account/add';
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            score: val,
            country: id
        }),
    });
    const res = await response.json();
}