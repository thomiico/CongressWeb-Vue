"use strict"

let chamber = document.querySelector("#tabla-house") ? "house" : "senate"

let URLAPI = `https://api.propublica.org/congress/v1/113/${chamber}/members.json`

let init = {
    method: "GET",
    headers: {
        "X-API-Key": "ixBLp38CvTeDHtpCvPQrHJu43zvLXk9ckE23tqdK"
    }
}

let baseData;
const form = document.querySelector("form")

fetch(URLAPI, init)
    .then(response => response.json())
    .then(data => {
        baseData = data   //.results[0].members

        drawSelect(baseData.results[0].members) // data.results[0].members

        /* Tabla Update */
        if (document.getElementById("table-body-member")) {
            drawTable(baseData, "table-body-member", 0); // data
        }

        if (document.getElementById("tabla-attendance")) {
            printTableML(0);
            printTableML(1);
        } else if (document.getElementById("table-loyalty")) {
            printTableLoyal(0);
            printTableLoyal(1);
        }

        countRepsPercentParty();

        let spinner = document.querySelector(".spinner")
        let pSpinner = document.querySelector(".padre-spinner")
        spinner.classList.add('displaynone');
        pSpinner.classList.add('displaynone');
    })
    .catch(error => console.warn(error.message))



//baseData.results[0].members.forEach((results)=>{console.table(results.first_name + " " + results.last_name)});      //data.results

const membersForState = (funcState) => {
    let filterStates = [];
    funcState.results[0].members.forEach(estado => {
        if (!filterStates.includes(estado.state)) {
            filterStates.push(estado.state);
        };
    });
    console.table(filterStates.sort());
}


/* ---------- */

const membersParty = (array, partido) => {
    let filterByParty = array.results[0].members.filter(miembro => miembro.party === partido)

    filterByParty.forEach(member => {
        console.log(member.first_name + " " + member.last_name + "-" + member.party);
    })
}


console.log("-------------");

const membersState = (array, estado) => {
    let filterByState = array.results[0].members.filter(miembro => miembro.state === estado)

    filterByState.forEach(member => {
        console.log(member.first_name + " " + member.last_name + "-" + member.state);
    })
}


/* Checkboxes */
if (document.getElementById("table-body-member")) {
    form.addEventListener("change", handleForm)
}

function handleForm() {
    // Select y Primer Filtro
    let select = form.querySelector("select")
    let primerFiltro = filtrar(baseData, select.value, "estado")    //data
    drawTable(primerFiltro, "table-body-member", 1)

    // capturar checkboxes 
    let checkboxes = form.querySelectorAll("input[type='checkbox']")
    // filtra los seleccionados, convirtiendo a "checkboxes" en array
    let arrayCheckboxes = Array.from(checkboxes)
    // obtengo el filtro de los checkboxes "checkeados"
    let checkboxesSeleccionados = arrayCheckboxes.filter(checkbox => checkbox.checked)
    // obtener los valores de los inputs seleccionados (el valor)
    let valoresSeleccionados = checkboxesSeleccionados.map(checkbox => checkbox.value)

    if (valoresSeleccionados.length === 0) {
        valoresSeleccionados.push("")
    }

    let filtradosPorPartido = filtrar(primerFiltro, valoresSeleccionados, "partido")
    drawTable(filtradosPorPartido, "table-body-member", 1)
}

/* Añadir los OPTION con los estados en el SELECT */
function drawSelect(array) {

    let stateList = [];

    let idSelect = document.getElementById("select-states")

    array.forEach((estado) => {
        if (!stateList.includes(estado.state))
            stateList.push(estado.state)
    })

    const fragmento = document.createDocumentFragment();
    stateList.forEach((estado) => {
        let option = document.createElement('option')
        option.value = estado;
        option.text = estado;

        if (document.getElementById("select-states")) {
            fragmento.appendChild(option);
        }
    })
    if (document.getElementById("select-states")) {
        idSelect.appendChild(fragmento);
    }
}

/* FILTRAR */
function filtrar(array, checkList, partyOrState) {
    if (partyOrState == "estado") {
        let auxiliar = []
        let selectValue = checkList;
        array.results[0].members.forEach((miembro) => {
            miembro.state == selectValue ? auxiliar.push(miembro) : selectValue == "all" ? auxiliar = array.results[0].members : ""
        })
        return auxiliar;
    }
    else if (partyOrState == "partido") {
        let auxiliar = []

        checkList.forEach((opcion) =>
            array.map((miembro) =>
                miembro.party === opcion ?
                    auxiliar.push(miembro) : opcion == "" ? auxiliar = array : ""))

        let auxiliar2 = new Set(auxiliar);
        auxiliar = Array.from(auxiliar2);
        console.log(auxiliar)
        return auxiliar;
    }
}

function drawTable(array, listHTML, bFirst) {
    const lista = document.querySelector(`#${listHTML}`);

    // Limpio la lista
    lista.innerHTML = ""

    let arrayNew;
    if (bFirst < 1) {
        arrayNew = array.results[0].members
    } else {
        arrayNew = array
    }

    if (array.length === 0) {
        let tableItem = document.createElement("tr");

        tableItem.innerHTML = `
        <td>No results found</td>
        <td>No results found</td>
        <td>No results found</td>
        <td>No results found</td>
        <td>No results found</td>
        `;

        if (document.getElementById(`${listHTML}`)) {
            lista.appendChild(tableItem);
        }
    }
    else {
        const fragmento = document.createDocumentFragment();
        arrayNew.forEach(member => {
            let tableItem = document.createElement("tr");

            let realName;
            if (member.middle_name === null) {
                realName = `${member.first_name} ${member.last_name}`;
            } else {
                realName = `${member.first_name} ${member.middle_name} ${member.last_name}`;
            }

            if (document.getElementById(`${listHTML}`)) {
                tableItem.innerHTML = `
                <td><a href="${member.url}" target="_blank">${realName}</a></td>
                <td>${member.party}</td>
                <td>${member.state}</td>
                <td>${member.seniority} years</td>
                <td>${member.votes_with_party_pct} %</td>
                `;


                fragmento.appendChild(tableItem);
            }
        })
        if (document.getElementById(`${listHTML}`)) {
            lista.appendChild(fragmento);
        }
    }
}

let nDemocrats = 0;
let nRepublicans = 0;
let nIndependents = 0;
let nTotal = 0;

let percentDemocrats = 0;
let percentRepublicans = 0;
let percentIndependents = 0;
let percentTotal = 0;

function countRepsPercentParty() {

    let array = baseData.results[0].members // data.results

    array.forEach((member) => {
        if (member.party == "D") {
            nDemocrats++
            percentDemocrats += member.votes_with_party_pct;
        }
        else if (member.party == "R") {
            nRepublicans++
            percentRepublicans += member.votes_with_party_pct;
        }
        else if (member.party == "ID") {
            nIndependents++
            percentIndependents += member.votes_with_party_pct;
        }
    })

    nTotal = nDemocrats + nRepublicans + nIndependents;

    percentTotal = (percentDemocrats + percentRepublicans + percentIndependents).toFixed(2);
    percentTotal = (percentTotal / nTotal).toFixed(2)
    printTable();
}


function printTable() {
    let tableSelector = document.querySelector("#table-body-count");

    let percentID = 0;
    if (nIndependents !== 0) {
        percentID = (percentIndependents / nIndependents).toFixed(2)
    }

    if (document.getElementById("table-body-count")) {

        tableSelector.innerHTML = `
        <tr><td>Democrats</td> <td>${nDemocrats}</td> <td>${(percentDemocrats / nDemocrats).toFixed(2)}</td></tr>
        <tr><td>Republicans</td> <td>${nRepublicans}</td> <td>${(percentRepublicans / nRepublicans).toFixed(2)}</td></tr>
        <tr><td>Independents</td> <td>${nIndependents}</td> <td>${percentID}</td></tr>
        <tr><td>Total</td> <td>${nTotal}</td> <td>${percentTotal}</td></tr>
        `;
        console.log(percentTotal)
    }
}

//---------------- task 3 tablas loyalty/attendance ---------------

function printTableML(reverse) {

    let selectorLeast = document.querySelector(".table-least-engaged")
    let selectorMost = document.querySelector(".table-most-engaged")

    let dataArrayB = baseData.results[0].members.sort((x, y) => {   // data.results
        if (x.missed_votes_pct < y.missed_votes_pct) {
            return 1;
        }
        else if (x.missed_votes_pct > y.missed_votes_pct) {
            return -1;
        } else {
            return 0;
        }
    });

    let dataArray = dataArrayB.filter((member) => member.total_votes !== 0)

    if (reverse) {
        dataArray = dataArray.reverse();
    }

    let dataArrayLength = 0;
    dataArrayLength = Math.round(dataArray.length * 0.1) - 1;

    console.log(dataArray);
    console.log(dataArrayLength)
    console.log("-----")
    console.log(dataArray[dataArrayLength - 1].first_name, dataArray[dataArrayLength - 1].missed_votes_pct)

    while (dataArray[dataArrayLength - 1].missed_votes_pct === dataArray[dataArrayLength].missed_votes_pct) {
        //console.log(dataArrayLength)
        dataArrayLength++;
    }

    const fragmento = document.createDocumentFragment();
    for (let i = 0; i < dataArrayLength; i++) {
        let leastTR = document.createElement("tr");

        let realName;

        if (dataArray[i].middle_name === null) {
            realName = `${dataArray[i].first_name} ${dataArray[i].last_name}`;
        } else {
            realName = `${dataArray[i].first_name} ${dataArray[i].middle_name} ${dataArray[i].last_name}`;
        }

        leastTR.innerHTML = `
            <td><a href="${dataArray[i].url}" target="_blank">${realName}<a></td><td>${dataArray[i].missed_votes}</td><td>${dataArray[i].missed_votes_pct}%</td>
            `

        fragmento.appendChild(leastTR);
    }
    reverse ? selectorMost.appendChild(fragmento) : selectorLeast.appendChild(fragmento);
}

function printTableLoyal(reverse) {

    let selectorLeastL = document.querySelector(".table-least-loyalty")
    let selectorMostL = document.querySelector(".table-most-loyalty")

    let dataArray = baseData.results[0].members.sort((x, y) => {            // data.results
        if (x.votes_with_party_pct > y.votes_with_party_pct) {
            return 1;
        }
        else if (x.votes_with_party_pct < y.votes_with_party_pct) {
            return -1;
        } else {
            return 0;
        }
    });

    //let dataArray = dataArrayB.filter((member) => member.total_votes !== 0)

    if (reverse) {
        dataArray = dataArray.reverse();
    }

    let dataArrayLength = Math.round(dataArray.length * 0.1);

    console.log(dataArray);
    console.log("-----")
    console.log(dataArray[dataArrayLength - 1].first_name, dataArray[dataArrayLength - 1].missed_votes_pct)


    while (dataArray[dataArrayLength - 1].votes_with_party_pct == dataArray[dataArrayLength].votes_with_party_pct) {
        dataArrayLength++
    }

    const fragmento = document.createDocumentFragment();
    for (let i = 0; i < dataArrayLength; i++) {
        let leastTRL = document.createElement("tr");

        let realName;

        if (dataArray[i].middle_name === null) {
            realName = `${dataArray[i].first_name} ${dataArray[i].last_name}`;
        } else {
            realName = `${dataArray[i].first_name} ${dataArray[i].middle_name} ${dataArray[i].last_name}`;
        }

        let votesParty = Math.round((dataArray[i].total_votes / 100) * dataArray[i].votes_with_party_pct)
        leastTRL.innerHTML = `
            <td><a href="${dataArray[i].url}" target="_blank">${realName}<a></td><td>${votesParty}</td><td>${dataArray[i].votes_with_party_pct}%</td>
            `

        if (document.getElementsByClassName("table-least-loyalty") || document.getElementsByClassName("table-most-loyalty")) {
            fragmento.appendChild(leastTRL);
        }
    }
    if (document.getElementsByClassName("table-least-loyalty") || document.getElementsByClassName("table-most-loyalty")) {
        reverse ? selectorMostL.appendChild(fragmento) : selectorLeastL.appendChild(fragmento);
    }
}

