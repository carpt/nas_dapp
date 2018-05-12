"use strict";

var AppItem = function(text) {
	if (text) {
		var obj = JSON.parse(text);
		this.name = obj.name;
        this.link = obj.link;
		this.author = obj.author;
        
	} else {
	    this.name = "";
        this.link = "";
	    this.author = "";
	}
};

AppItem.prototype = {
	toString: function () {
		return JSON.stringify(this);
	}
};

var AppMarket = function () {
 
   LocalContractStorage.defineMapProperty(this, "arrayMap");

   LocalContractStorage.defineMapProperty(this, "dataMap", {
        parse: function (text) {
            return new AppItem(text);
        },
        stringify: function (o) {
            return o.toString();
        }
    });
   LocalContractStorage.defineProperty(this, "size");
};

AppMarket.prototype = {
    init: function () {
        this.size = 0;
    },


    save: function (name, link) {
        var index = this.size;
        name = name.trim();
        link = link.trim();
       
        if (name === "" || link === ""){
            throw new Error("empty name / content");
        }
        if (name.length > 64 || link.length > 128 ){
            throw new Error("name / link exceed limit length")
        }
        this.arrayMap.set(index, name);

        var from = Blockchain.transaction.from;
        var app = this.dataMap.get(name);
        if (app){
            throw new Error("App名字已经被占用");
        }

        app = new AppItem();
        app.name = name;
        app.link = link;
        app.author = from;
        this.dataMap.put(name, app);

        this.size +=1;

    },

    get: function (name) {
        var name = name.trim();
        if ( name === "" ) {
            throw new Error("empty name")
        }
        return this.dataMap.get(name);
    },

    len:function(){
      return this.size;
    },

    forEach: function(limit, offset){
        var result = [];
        if(offset>this.size){
           return result;
        }
        limit = parseInt(limit);
        offset = parseInt(offset);
        if (limit <= 0) {
            limit = 20;
        }
        if (offset < 0) {
            offset = 0;
        }

        var number = offset+limit;
        if(number > this.size){
          number = this.size;
        }
        for(var i=offset;i<number;i++){
            var name = this.arrayMap.get(i);
            var object = this.dataMap.get(name);
           result.unshift(object);
        }
        return result;
    }

};
module.exports = AppMarket;