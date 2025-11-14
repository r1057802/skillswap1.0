<!-- 
    Settings van de component
-->
<script setup>
    // ------ Import
    import { ref, onMounted } from "vue";

    // ------ Props -> gebruiken we als onze parent data moet geven READ ONLY
    const props = defineProps({
        counterName: String,
        counterInitialValue: Number
    })

    // ------ Data -> gebruiken we intern en hierbij kunnen data aanpassen 
    let counterValue = ref(0); // ref gebruiken we als we de data willen linken met de template
    
    // ------ Life cycle
    onMounted(() =>{
        counterValue.value = props.counterInitialValue;
        console.log("Component rendered");
    })

    // ------ Methods
    const increment = () => {
        counterValue.value++;
    }

    const decrement = () => {
        if (counterValue.value > 0) {
            counterValue.value--;
        }
    }

    const showMinButton = () => {
        if (counterValue.value > 0) {
            return true;
        } else {
            return false;
        }
    }
</script>

<!-- 
    Wat de gebruiker zal zien en 
    is gelinkt met script
-->
<template>
    <div>
        <h2> 
            {{ counterName }}
        </h2>
        <p>
            {{  counterValue }}
        </p>
        <p>
            Initial value : {{  counterInitialValue }}
        </p>

        <!-- You can use v-on:click, but we use shorthand @click -->
        <button @click="increment()">
            Add
        </button>

        <!-- v-if="showMinButton()" -> use if you want to hide/show button based on value -->
        <button @click="decrement" :disabled="counterValue <= 0">
            Min
        </button>
    </div>
</template>