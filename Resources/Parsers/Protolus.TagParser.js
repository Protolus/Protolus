/*
---
description: An extensible Mootools object container bridging to a pureJS SAX parser

license: [MIT-style, LGPL]

authors:
- Abbey Hawk Sparrow

requires:
    core/1.2.4: '*'

provides: [Midas.XMLParser]
...
*/
Protolus.TagParser = new Class({ //my ultra-slim tag parser
    strict : true,
    opener : '<',
    closer : '>',
    attributeAssign : '=',
    attributeDelimiters : ['"'],
    closeEscape : '/',
    allowUndelimitedAttributes : false,
    literalTags : [],
    unaryTags : [],
    specialTags : {},
    unrecognized : 'unary',
    initialize: function(options){
        Object.each(options, function(option, name){
            this[name] = option;
        }.bind(this));
        if(typeOf(this.literalTags) == 'string') this.literalTags = this.literalTags.split(',');
        if(typeOf(this.attributeDelimiters) == 'string') this.attributeDelimiters = this.attributeDelimiters.split(',');
        //console.log(['this', this]);
    },
    open: function(tag){
        this.tagStack.push(tag);
        //console.log('open:'+tag.name);
    },
    content: function(text){
        if(this.tagStack[this.tagStack.length-1]){
            if(!this.tagStack[this.tagStack.length-1].children) this.tagStack[this.tagStack.length-1].children = [];
            this.tagStack[this.tagStack.length-1].children.push(text);
        }
    },
    close: function(tag){
        //console.log('close:'+tag.name);
        var tag = this.tagStack.pop(tag);
        if(this.tagStack[this.tagStack.length-1]){
            if(!this.tagStack[this.tagStack.length-1].children) this.tagStack[this.tagStack.length-1].children = [];
            this.tagStack[this.tagStack.length-1].children.push(tag);
        }
        this.lastTag = tag;
    },
    error: function(exception){
        console.log(exception);
    },
    parse: function(xmlChars){
        var recognizedTags = this.unaryTags.clone().combine(this.literalTags).combine(Object.keys(this.specialTags));
        var tagOpen = false;
        var currentTag = '';
        var content = '';
        var ch;
        this.tagStack = [{}];
        var tagStack = [];
        var literalMode = false;
        var literal = this.literalTags[0];
        var strictError = 'Strict parse error: Unmatched Tag!';
        for(var lcv = 0; lcv < xmlChars.length; lcv++){
            ch = xmlChars[lcv];
            //console.log(['char', ch, xmlChars.substring(lcv, lcv+literal.length+3)]);
            if(tagOpen){
                if(ch == this.closer){
                    //console.log('closer');
                    var tag = this.parseTag(currentTag);
                    if(tag.name[0] == this.closeEscape){
                        //console.log('close closing('+tag.name.substring(1)+') tag');
                        tag.name = tag.name.substring(1);
                        this.close(tag);
                        var lastTag = tagStack.pop();
                        if(this.strict && lastTag.name != tag.name){
                            this.error(strictError+' ['+lastTag.name+']');
                            return;   
                        }
                        //literalMode = this.literalTags.contains(tagStack[tagStack.length-1]);
                    }else{
                        //console.log('close opening tag');
                        this.open(tag);
                        tagStack.push(tag);
                        literalMode = this.literalTags.contains(tag.name);
                        if(literalMode) literal = tag.name;
                        if(
                            currentTag[currentTag.length-1] == this.closeEscape || 
                            this.unaryTags.contains(tag.name) ||
                            (this.unrecognized == 'unary' && !recognizedTags.contains(tag.name))
                        ){
                            this.close(tag);
                            var lastTag = tagStack.pop();
                            if(this.strict && lastTag.name != tag.name){
                                this.error(strictError+' ['+lastTag.name+']');
                                return;
                            }
                            //literalMode = this.literalTags.contains(tagStack[tagStack.length-1].name);
                        }
                    }
                    tagOpen = false;
                }else currentTag += ch;
                //console.log('tag char');
            }else{
                if(
                    ch == this.opener &&
                    (
                        !literalMode || // we aren't in literal mode, thus we could close any tag
                        (currentTag == 'literal' && xmlChars.substring(lcv, lcv+literal.length+3) == '{/'+literal+'}') //we are in literal mode and we're closing a literal tag
                    )
                ){
                    currentTag = '';
                    tagOpen = true;
                    if(content.trim() != '') this.content(content.trim());
                    content = '';
                    literalMode = false;
                }else content += ch;
                //console.log('ch++');
            }
        }
        if(content.trim() != '') this.content(content.trim());
        this.root = lastTag;
        return this.tagStack.shift();
    },
    parseTag: function(tag){
        var ch;
        var currentValue = '';
        var tagName = false;
        var attributeName = false;
        var inQuote = false;
        var attributes = {};
        for(var lcv = 0; lcv < tag.length; lcv++){
            ch = tag[lcv];
            if(tagName){
                var endedQuote = false;
                if(inQuote){
                    if(inQuote == ch){ //end of quote
                        inQuote = false;
                        endedQuote = true;
                    }else{
                        currentValue += ch;
                        continue;
                    }
                }else{
                    if(this.attributeDelimiters.contains(ch)){
                        inQuote = ch;
                        continue;
                    }
                }
                if(attributeName){
                    if(ch == ' ' || endedQuote){
                        attributes[attributeName.trim()] = currentValue;
                        attributeName = false;
                        currentValue = '';
                    }else currentValue += ch;
                }else{
                    if(ch == this.attributeAssign){
                        attributeName = currentValue;
                        currentValue = '';
                    }else currentValue += ch;
                }
                this.attributeDelimiters.contains(ch)
            }else{
                if(ch == ' '){
                    tagName = currentValue;
                    currentValue = '';
                }else currentValue += ch;
            }
        }
        if(attributeName && currentValue != ''){
            attributes[attributeName.trim()] = currentValue;
        }
        if(!tagName) tagName = currentValue;
        return {
            name: tagName,
            attributes: attributes,
            full : tag
        };
    }
});