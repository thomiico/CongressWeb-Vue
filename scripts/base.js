const app = Vue.createApp({

    data() {
        return {
            state: "all",
            filterPartys: [],
            members: [],
            filterMembers: [],

            stats: {
                cMembersID: [],
                cMembersR: [],
                cMembersD: [],
                cMembersTotal: 0,

                gVotedPartyID: 0,
                gVotedPartyR: 0,
                gVotedPartyD: 0,

                gTotalVotedParty: 0

            }
        }
    }, 

    created() {
        let chamber = "";
        if (document.URL.includes("senate")) {
          chamber = "senate";
        }
        if (document.URL.includes("house")) {
          chamber = "house";
        }
        
        let urlapi = `https://api.propublica.org/congress/v1/113/${chamber}/members.json`;

        let init = {
            method: "GET",
            headers: {
                "X-API-Key": "ixBLp38CvTeDHtpCvPQrHJu43zvLXk9ckE23tqdK"
            }
        }

        fetch(urlapi, init)
        .then(response => response.json())
        .then(data => {
            this.members = data.results[0].members
            this.filterMembers = data.results[0].members

            this.stats.cMembersD = this.countMembers("D")
            this.stats.cMembersR = this.countMembers("R")
            this.stats.cMembersID = this.countMembers("ID")
            this.stats.cMembersTotal = this.countTotal()

            this.stats.gVotedPartyD = this.attendanceVotedDemocrats()
            this.stats.gVotedPartyR = this.attendanceVotedRepublicans()
            this.stats.gVotedPartyID = this.attendanceVotedIndependents()

            this.stats.gTotalVotedParty = this.attendanceVotedTotal()
        })
        .catch(error => console.warn(error.message))
    },

    methods: {
        //drawSelect(this.members) // data.results[0].members
        drawSelect(){
            let statesArray = this.members.map(mystate => mystate.state).sort()
            let array = new Set(statesArray);
            return array;
        },

        countMembers(party){
            return this.members.filter(member => member.party == party)
        },

        countTotal(){
            return (this.countMembers("D").length + this.countMembers("R").length + this.countMembers("ID").length)
        },

        attendanceVotedDemocrats(){
            return parseFloat(this.calcPartyPct(this.stats.cMembersD, "votes_with_party_pct").toFixed(2))
        },
        attendanceVotedRepublicans(){
            return parseFloat(this.calcPartyPct(this.stats.cMembersR, "votes_with_party_pct").toFixed(2))
        },
        attendanceVotedIndependents(){
            if(this.stats.cMembersID.length == 0)
                return "-";

            return parseFloat(this.calcPartyPct(this.stats.cMembersID, "votes_with_party_pct").toFixed(2))
        },

        calcPartyPct(array, celda){
            let pctTotal = 0;
            array.forEach(member => {
                pctTotal += member[celda]
            })
            pctTotal = pctTotal / array.length
            return pctTotal;
        },

        attendanceVotedTotal(){
            if(this.stats.cMembersID.length == 0){
                return ((this.stats.gVotedPartyD + this.stats.gVotedPartyR)/2).toFixed(2) 
            }
            return ((this.stats.gVotedPartyD + this.stats.gVotedPartyR + this.stats.gVotedPartyID)/3).toFixed(2)
        },


        getEngaged(type){
            let dataArrayB = this.members.sort((x,y) => {
                if (x.missed_votes_pct < y.missed_votes_pct) {
                    return 1;
                }
                else if (x.missed_votes_pct > y.missed_votes_pct) {
                    return -1;
                } else {
                    return 0;
                }
            })

            let dataArray = dataArrayB.filter((member) => member.total_votes !== 0)

            if(type == "MOST"){
                dataArray = dataArray.reverse();    
            }

            let percentTotal = 0;
            percentTotal = Math.round(dataArray.length * 0.1) -1;

            while(dataArray[percentTotal-1].missed_votes_pct === dataArray[percentTotal].missed_votes_pct){
                percentTotal++;
            }

            return dataArray.slice(0, percentTotal);
        },
        getLoyal(type){
            let dataArrayB = this.members.sort((x,y) => {
                if (x.votes_with_party_pct < y.votes_with_party_pct) {
                    return 1;
                }
                else if (x.votes_with_party_pct > y.votes_with_party_pct) {
                    return -1;
                } else {
                    return 0;
                }
            })

            let dataArray = dataArrayB.filter((member) => member.total_votes !== 0)

            if(type == "LEAST"){
                dataArray = dataArray.reverse();    
            }

            let percentTotal = 0;
            percentTotal = Math.round(dataArray.length * 0.1);

            while(dataArray[percentTotal-1].missed_votes_pct === dataArray[percentTotal].missed_votes_pct){
                percentTotal++;
            }

            return dataArray.slice(0, percentTotal);
        }

    },

    computed: {
        
        filterCheckSelect(){
            this.filterMembers = this.members.filter(member => (this.state == "all" || member.state == this.state) && (this.filterPartys.includes(member.party) || this.filterPartys.length == 0))
            return this.filterMembers;
        }

    }

});

app.mount('#app');