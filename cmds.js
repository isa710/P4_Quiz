/**
 * Created by im.rodriguez on 28/02/18.
 */

const model = require('./model');

const {log, biglog, errorlog, colorize} = require("./out");



exports.helpCmd = rl => {
    log("Comandos");
    log(" h|help - Muestra esta ayuda.");
    log(" list - Listar los quizzes existentes.");
    log(" show <id> - Muestra la pregunta y la respuesta el quiz indicado.");
    log(" add - Añadir un nuevo quiz interactivamente.");
    log(" delete <id> -  Borrar el quiz indicado");
    log(" edit <id> - Editar el quiz indicado.");
    log(" test <id> - Probar el quiz indicado.");
    log(" p|olay - Jugar a preguntar aleatoriamente todos los quizzes.");
    log(" credits - Créditos.");
    log(" q|quit - Salir del programa.");
    rl.prompt();
};


exports.listCmd = rl => {
    model.getAll().forEach((quiz, id) => {
        log(`   [${colorize(id, 'magenta')}]: ${quiz.question}`);
    });
    rl.prompt();
};


exports.showCmd = (rl, id) => {

    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
    }else{
        try{
            const quiz = model.getByIndex(id);
            log(`  [${colorize(id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        } catch (error){
            errorlog(error.message);
        }
    }

    rl.prompt();
};



exports.addCmd = rl => {
    rl.question(colorize(' Introduzca una pregunta:  ', 'red'), question => {
        rl.question(colorize( ' Introduzca la respuesta: ', 'red'), answer => {
            model.add(question, answer);
            log(`${colorize('Se ha añadido', 'magenta')}: ${question} ${colorize('=>', 'magenta')} ${answer}`);
            rl.prompt();
        });
    });
};


exports.deleteCmd = (rl, id) => {
    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
    } else {
        try {
            model.deleteByIndex(id);
        } catch(error) {
            errorlog(error.message);
        }
    }
    rl.prompt();
};


exports.editCmd = (rl, id) => {
    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
        rl.prompt();
    }else{
        try {
            const quiz = model.getByIndex(id);

            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
            rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {

                process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
                rl.question(colorize( 'Introduzca la respuesta: ', 'red'), answer => {

                    model.update(id, question, answer);
                    log(` Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${question} ${colorize('=>', 'magenta')} ${answer}`);
                    rl.prompt();
            });
            });
        }catch (error) {
            errorlog(error.message);
            rl.prompt();
        }
    }
};

//preguntar al usuario la pregunta  y  en funcion de su respuesta diga si es correcta o incorrecta
exports.testCmd = (rl, id) => {
    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
        rl.prompt();
    }else{
        try {

            const quiz = model.getByIndex(id);
            rl.question(colorize(` ${quiz.question}` + " " , 'red'), respuesta => {

                if(respuesta.toLowerCase().trim() == quiz.answer.toLowerCase().trim()){
                log(`Correcta`, 'green');
            }else{
                log(`Incorrecta`, 'red');
        }
        });
        }catch (error) {
            errorlog(error.message);
            rl.prompt();
        }
    }
};

/** Pregunta todos los quizzes existentes en el modelo en orden aleatorio
 * Se gana si se contesta a todos satisfactoriamente.
 *
 * @param rl Objeto realine usado para implementar CLI
 */
exports.playCmd = rl => {
    let score = 0; //almacena preguntas que se han ido acertando
    let toBeResolved = []; //array preguntas que me quedan por contestar


   // var i=0;
    for( var i = 0; i<model.count(); i++) {
        toBeResolved[i]=i;
    };


    const playOne = () =>
    {
        let tamanoToBeResolved = toBeResolved.length;

        if (toBeResolved.length == 0) { //puede que no haya preguntas por resolver
            log(`No hay nada más que preguntar.`); // Mensaje que dice que no hay nada que preguntar
            log(`Fin de examen. Aciertos: `);  //Fin del juego
            biglog((`${score}`)); //Saca el resultado
            rl.prompt();

        } else { // si el array no esta vacio cojo una pregunta al azar
            try {

                let id = Math.floor(Math.random() * toBeResolved.length); //lo del math me da el id

                const quiz = model.getByIndex(id);  //saco pregunta asociada al id
                toBeResolved.splice(id, 1); //Borro la pregunta del array


                rl.question(colorize(` ${quiz.question}` + " " , 'red'), respuesta => { //Hago la pregunta
                    if((respuesta.toLowerCase().trim()) == (quiz.answer.toLowerCase().trim())){ //Si acierta

                    score = score + 1; //Sumo 1 a score
                    log(`CORRECTO - Lleva ${score} aciertos.`); //Saco mensaje
                    playOne(); //llamada recursiva al play

                }
            else
                {   //Si fallo termina el juego y saco mensaje
                    log(`INCORRECTO.`);
                    log(`Fin del examen. Aciertos:`);
                    biglog(colorize(`${score}`));
                    rl.prompt();
                }
            });
            } catch (error) {
                errorlog(error.message);
                rl.prompt();
            }
        }
    }

        playOne() //para que empiece el proceso
};


exports.creditsCmd = rl => {
    log('Autores de la práctica:');
    log('Isabel Maria Rodriguez Marquez', 'green');
    rl.prompt();
};


exports.quitCmd = rl => {
    rl.close();
};
