(function() {

var AvroFuzz = function(elementsArray, gramSizeLower, gramSizeUpper) {
   var avrofuzz = {
      GRAM_SCORE_BASE: 0.1,
      GRAM_SCORE_SCALE: 1.0
   };


   // Ensure we have default options
   elementsArray = elementsArray || [];
   avrofuzz.gramSizeLower = gramSizeLower || 2;
   avrofuzz.gramSizeUpper = gramSizeUpper || 4;

   // define all the object functions and attributes
   avrofuzz.exactSet = [];
   avrofuzz.matchDict = [];
   avrofuzz.items = {};

   avrofuzz.getMinimumGramSize = function() {
      return this.gramSizeLower;
   }
   
   avrofuzz.getMaximumGramSize = function() {
      return this.gramSizeUpper;
   }

   //
   //   Gets a set of values from our dictionary based on a fragment
   //
   avrofuzz.get = function(value) {
      var normalisedValue = this._normalise(value);
      var exactResult = this.exactSet[normalisedValue];
      if(exactResult) {
         return [[1, exactResult]];
      }

      var results = [];

      // Start at our upper boundary and work our way down the n-gram sizes
      // until we find a result set. Note, we want to be smart about how we 
      // search, so we'll use exact n-gram lengths when the size of the 
      // input value is less than the upper boundary of our n-gram.
      // In other words, if our input is length 2, don't bother searching
      // 3+ length n-grams.
      var searchGramSize = normalisedValue.length;
      if(normalisedValue.length > this.gramSizeUpper) {
         searchGramSize = this.gramSizeUpper;
      }

      for(searchGramSize; searchGramSize >= this.gramSizeLower; --searchGramSize) {
         
         // We want to make sure that we are searching by the correct length
         var ngramResults = this._getByNGram(normalisedValue, searchGramSize);
         
         // We want to skip the rest of the search with smaller n-grams since
         // we have matches for this (higher value) n-gram
         if(ngramResults.length > 0) {
            return ngramResults;
         }
      }
      
      return null;
   }

   // Searches for any n-grams in the specified gram size that match the value
   avrofuzz._getByNGram = function(value, gramSize) {
      
      var results = [];
      var itemList = this.items[gramSize];
      
      var scores = {};
      var counts = {};
      var matches = {};
      
      // Loop over the whole length of the value to determine our final score
      // for matches on a per-unit basis
      for(var subNgramOffset = 0; subNgramOffset + gramSize <= value.length; ++subNgramOffset) {
         for(itemKey in itemList) {
            if(itemKey == value.substring(subNgramOffset, subNgramOffset + gramSize)) {
               // We have a match for our n-gram, let's go ahead and create
               // our set of weights for the score
               var matchedNgrams = itemList[itemKey];
               _.each(matchedNgrams, function(ngram) {      
                  if(scores.hasOwnProperty(ngram.source.tab.id)) {
                     scores[ngram.id] += ngram.bias * avrofuzz.GRAM_SCORE_SCALE;
                     counts[ngram.id] += 1;
                  }
                  else {
                     scores[ngram.id] = ngram.bias * avrofuzz.GRAM_SCORE_SCALE;
                     counts[ngram.id] = 1;
                  }
                  
                  matches[ngram.id] = ngram;
               });
            }
         }
      }
      
      // Balance the results based on the number of ngrams we had to use
      // to find matches
      for(scoreOffset in scores) {
         scores[scoreOffset] = scores[scoreOffset] / counts[scoreOffset];
      }
      
      // Populate our results list based on scores greater than zero
      for(offset in matches) {
         if(scores[offset] > 0) {
            results.push([ scores[offset], matches[offset].source ]);
         }
      }
                 
      results.sort(sortNgramsDescending);
      function sortNgramsDescending(a, b) {
         if (a[0] < b[0]) {
             return 1;
         } else if (a[0] > b[0]) {
             return -1;
         } else {
             return 0;
         }
      }
      
      return results;
   }
   

   //
   //  Adds a string to our fuzzy matcher
   //
   avrofuzz.add = function(searchToken) {
      var normalisedValue = this._normalise(searchToken['value']);
      // Check if we already have this value and don't process it a second time
      if(normalisedValue in this.exactSet) {
         return false;
      }

      // Calculate all the n-grams for this value, inclusive of the upper end
      var i = this.gramSizeLower;
         for(i; i < this.gramSizeUpper + 1; ++i) {
            this._addByNGram(searchToken, i);
      }
   }

   // Adds the n-grams of the value to collection
   avrofuzz._addByNGram = function(searchToken, ngramLength) {
      
      var normalisedValue = this._normalise(searchToken.value);

      var text = normalisedValue;
      var textMid = Math.ceil(text.length / 2);
            
      // Loop over every offset for this particular word
      for(var gramIter = 0; gramIter < text.length; ++gramIter) {
         // We will ignore the last part of the text that
   		// is less than the length of our n-gram so as not
   		// to over-run our text.
         // note: n-grams of shorter length are handled by other iterations
         // of this function (where ngramLength is a different value)
         var ngramValue = {};
   		if(gramIter + ngramLength <= text.length) {            
            ngramValue.source = searchToken;
            ngramValue.id = searchToken.id;
            ngramValue.value = text.substring(gramIter, gramIter + ngramLength);
   		}
         else {
            continue;
         }
      
   		// Everything after the middle of the text has a score
   		// derived from the base n-gram score
   		if(gramIter >= textMid) {
   			ngramValue.bias = this.GRAM_SCORE_BASE;
   		}
   		// Anything before the middle of the n-gram will have 
   		// a score added to the base that is a coefficient of
   		// its distance from the middle of the text
   		//
   		// I.e., the largest values will be at the start of the
   		// text and will normalise to GRAM_SCORE_BASE by the end.
   		else {
   			ngramValue.bias = this.GRAM_SCORE_BASE + ((text.length - gramIter) / text.length);
   		}
         
         if(!this.items.hasOwnProperty(ngramLength)) {
            this.items[ngramLength] = {};
         }
         if(!this.items[ngramLength].hasOwnProperty(ngramValue.value.toString())) {
            this.items[ngramLength][ngramValue.value.toString()] = [];
         }
         
         this.items[ngramLength][ngramValue.value.toString()].push(ngramValue);            
         
      }
      
      this.exactSet[normalisedValue] = searchToken      
   }
       
    // Normalises a submitted value    
    avrofuzz._normalise = function(value) {
      if (Object.prototype.toString.call(value) !== '[object String]') throw 'Must pass a string as argument to AvroFuzz.Add';
      return value.toLowerCase();
    }
    
    // return length of items in set
    avrofuzz.length = function() {
        var count = 0,
            prop;
        for (prop in this.exactSet) {
            if (this.exactSet.hasOwnProperty(prop)) {
                count += 1;
            }
        }
        return count;
    };

    // return is set is empty
    avrofuzz.isEmpty = function() {
        for (var prop in this.exactSet) {
            if (this.exactSet.hasOwnProperty(prop)) {
                return false;
            }
        }
        return true;
    };
    
    

    // initialization
    var i = avrofuzz.gramSizeLower;
    for (i; i < avrofuzz.gramSizeUpper + 1; ++i) {
        avrofuzz.items[i] = [];
    }
    // add all the items to the set
    for (i = 0; i < elementsArray.length; ++i) {
        avrofuzz.add(elementsArray[i]);
    }
       
    return avrofuzz;
};

var root = this;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AvroFuzz;
    root.AvroFuzz = AvroFuzz;
} else {
   root.AvroFuzz = AvroFuzz;
}

})();
