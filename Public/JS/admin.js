const { json } = require("body-parser");
const { response } = require("express");

function gen_add() {
    const num = document.getElementById('num').value;
    const form = document.getElementById("add-event");

    if (form.hasChildNodes) {
        form.innerHTML = ''
    };

    for (let i = 0; i < num; i++) {
        label = document.createElement('label');
        label.setAttribute('for', i + 1)
        label.innerHTML = `Enter country no.${i + 1} name:`
        form.appendChild(label)
        input = document.createElement('input');
        input.type = 'text';
        input.name = `${i + 1}`;
        input.className = 'form-control';
        input.setAttribute('required', '')
        form.appendChild(input);
    }

    submit = document.createElement('input');
    submit.type = 'submit';
    submit.className = 'btn bg-primary text-white mt-3';
    form.appendChild(submit);
};

async function edit_add() {
    val = document.getElementById('edit-select').value;
    const url = 'http://localhost:3000/admin/edit_select';
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            edit: val
        })
    });
    const res = await response.json();
    const result = res.data;
    
    const form = document.getElementById('selected_form');
    count = 0

    if (form.hasChildNodes) {
        form.innerHTML = ''
    };

    result.forEach(element => {
        // create label
        label = document.createElement('label');
        label.setAttribute('for', count + 1);
        label.innerHTML = `Enter country no.${count + 1} name:`;
        form.appendChild(label);
        // create new input
        input = document.createElement('input');
        input.type = 'text';
        input.name = count + 1;
        input.className = 'form-control';
        input.value = element.name;
        input.setAttribute('required', '');
        form.appendChild(input);
        count++;
    });

    submit = document.createElement('input');
    submit.type = 'submit';
    submit.className = 'btn bg-primary text-white mt-3';
    form.appendChild(submit);
};

async function delete_year() {
    val = document.getElementById('to_delete').value;
    const url = 'http://localhost:3000/admin/delete';
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            edit: val
        })
    });
    const res = await response.json();
    console.log(res)
    window.location.href = 'http://localhost:3000/admin'
};