async function create_user_graph () {
    const url = 'http://localhost:3000/account/user_stats';
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sent: true,
        }),
    });

    const res = await response.json();

    let names = res.names[0];
    let scores = res.scores[0];

    for (let i = 0; i < names.length; i++) {
        names[i] = names[i].name;
        scores[i] = scores[i].score;
    };

    const user_chart = document.getElementById('user-stats');

    new Chart(user_chart, {
        type: 'bar',
        data: {
          labels: names,
          datasets: [{
            label: 'Score',
            data: scores,
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            },
          },
          plugins: {
            zoom: {
              zoom: {
                wheel: {
                  enabled: true,
                },
                pinch: {
                  enabled: true
                },
                mode: 'xy',
              },
              pan: {
                enabled: true,
                mode: 'xy',
              },
              limits: {
                y: {
                  min: 0,
                  max: 100
                },
              }
            },
            scales: {
              y: {
                min: 0,
                max: 100,
              },
            }
          },
        },
    });
};
create_user_graph()

async function create_user_top() {
  const url = 'http://localhost:3000/account/user_top';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        sent: true,
    }),
  });
  const res = await response.json();

  let names = res.names[0]

  for (let i = 0; i < names.length; i++) {
    names[i] = names[i].name;
  };

  names.reverse()

  const user_top = document.getElementById('user-top');
  count = 1
  names.forEach(element => {
    p = document.createElement('p');
    p.innerHTML = `${count}. ${element}`;
    p.className = 'text-black';
    user_top.appendChild(p);
    count++;
  });
  };
  create_user_top()

async function create_total_top() {
  const url = 'http://localhost:3000/account/total_top';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sent: true,
    }),
  });

  const res = await response.json();

  let names = res.names;

  const total_top = document.getElementById('total-top');
  let count = 1;

  if (document.getElementById('total-top-generated') != null) {
    document.getElementById('total-top-generated').remove()
    document.getElementById('total-top-generated').remove()
    document.getElementById('total-top-generated').remove()
  };

  names.forEach(element => {
    const p = document.createElement('p');
    p.innerHTML = `${count}. ${element}`;
    p.className = 'text-black';
    p.id = 'total-top-generated'
    total_top.appendChild(p);
    count++;
  });

  return setTimeout(() => create_total_top(), 10000);
};
create_total_top()

async function create_total_graph() {
  const url = 'http://localhost:3000/account/total_graph';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sent: true,
    }),
  });

  const res = await response.json();
  console.log(res);
  
  let names = res.names;
  let scores = res.scores;

  console.log(names, scores);
  
  for (let i = 0; i < names.length; i++) {
    names[i] = names[i].name;
  };

  const user_chart = document.getElementById('total-stats');

  total_graph = new Chart(user_chart, {
      type: 'bar',
      data: {
        labels: names,
        datasets: [{
          label: 'Score',
          data: scores,
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          },
        },
        plugins: {
          zoom: {
            zoom: {
              wheel: {
                enabled: true,
              },
              pinch: {
                enabled: true
              },
              mode: 'xy',
            },
            pan: {
              enabled: true,
              mode: 'xy',
            },
            limits: {
              y: {
                min: 0,
                max: 100
              },
            }
          },
          scales: {
            y: {
              min: 0,
              max: 100,
            },
          }
        },
      },
  });
  return setTimeout(() => update_total(), 10000);
}
create_total_graph();

async function update_total() {
    const url = 'http://localhost:3000/account/total_graph';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sent: true,
    }),
  });

  const res = await response.json();
  console.log(res);
  
  let scores = res.scores;

  total_graph.data.datasets.forEach((dataset) => {
    dataset.data.pop()
  });
    total_graph.data.datasets.forEach((dataset) => {
    dataset.data.push(scores)
  });

  return setTimeout(() => update_total(), 10000);
};