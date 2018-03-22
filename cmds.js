/**
 * Created by im.rodriguez on 28/02/18.
 */

const {models} = require('./model');

const {log, biglog, errorlog, colorize} = require("./out");

const Sequelize = require('sequelize');

exports.helpCmd = (socket, rl) => {
    log(socket, "Comandos");
    log(socket, " h|help - Muestra esta ayuda.");
    log(socket, " list - Listar los quizzes existentes.");
    log(socket, " show <id> - Muestra la pregunta y la respuesta el quiz indicado.");
    log(socket, " add - Añadir un nuevo quiz interactivamente.");
    log(socket, " delete <id> -  Borrar el quiz indicado");
    log(socket, " edit <id> - Editar el quiz indicado.");
    log(socket, " test <id> - Probar el quiz indicado.");
    log(socket, " p| play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log(socket, " credits - Créditos.");
    log(socket, " q|quit - Salir del programa.");
    rl.prompt();
};


exports.listCmd = (socket, rl) => {
    models.quiz.findAll()  //Promesa
        .each(quiz =>  {
        log(socket, ` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
})

.catch(error => {
        errorlog(socket, error.message);
})
.then(() => {
        rl.prompt();
});
};


const validateId = id => {
    return new Sequelize.Promise((resolve, reject) => {
        if(typeof id === "undefined") {
        reject(new Error(`Falta el parámetro <id>.`));
    }else{
        id= parseInt(id);
        if(Number.isNaN(id)){
            reject(new Error(`El valor del parámetro <id> no es un número`));
        }else{
            resolve(id);
        }
    }
});
};


exports.showCmd = (socket, rl, id) => {
    validateId(id)
        .then(id => models.quiz.findById(id))
.then(quiz => {
        if(!quiz) {
        throw new Error('No existe un quiz asociado al id=${id}.');
    }
    log(socket, ` [${colorize(id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`)
})
.catch(error => {
        errorlog(socket, error.message);
})
.then(() => {
        rl.prompt();
});
};

const makeQuestion = (rl,text) => {
    return new Sequelize.Promise((resolve,reject) => {
        rl.question(colorize(text, 'red'), answer => {
        resolve(answer.trim());
});
});
};


exports.addCmd = (socket, rl) => {
    makeQuestion(rl, 'Introduzca una pregunta: ')
        .then(q => {
        return makeQuestion(rl, ' Introduzca la respuesta: ')
            .then(a => {
            return {question: q, answer: a};
});
})
.then(quiz => {
        return models.quiz.create(quiz);
})
.then((quiz) => {
        log(socket, `${colorize('Se ha añadido', 'magenta')}: ${question} ${colorize('=>', 'magenta')} ${answer}`);
})
.catch(Sequelize.ValidationError, error => {
        errorlog(socket, 'El quiz es erroneo: ');
    error.errors.forEach(({message}) => errorlog(message));
})
.catch(error => {
        errorlog(socket, error.message);
})
.then(() => {
        rl.prompt();
});

};


exports.deleteCmd = (socket, rl, id) => {
    validateId(id)
        .then(id => models.quiz.destroy({where: {id}}))
.catch(error => {
        errorlog(socket, error.message);
})
.then(() => {
        rl.prompt();
});
};


exports.editCmd = (socket, rl, id) => {
    validateId(id)
        .then(id => models.quiz.findById(id))
.then(quiz => {
        if(!quiz) {
        throw new Error('No existe un quiz asociado al id=${id}.');
    }

    process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
    return makeQuestion(rl, 'Introduzca la pregunta: ')
        .then(q => {
        process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
    return makeQuestion(rl, 'Introduzca la respuesta: ')
        .then(a => {
        quiz.question = q;
    quiz.answer =a;
    return quiz;
});
});
})
.then(quiz => {
        return quiz.save();
})
.then(quiz => {
        log(socket, ` Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${question} ${colorize('=>', 'magenta')} ${answer}`);
})
.catch(Sequelize.ValidationError, error => {
        errorlog(socket, 'El quiz es erroneo: ');
    error.errors.forEach(({message}) => errorlog(message));
})
.catch(error => {
        errorlog(socket, error.message);
})
.then(() => {
        rl.prompt();
});

};

//preguntar al usuario la pregunta  y  en funcion de su respuesta diga si es correcta o incorrecta
exports.testCmd = (socket, rl, id) => {
    validateId(id)
        .then(id => models.quiz.findById(id))
.then(quiz => {
        if(
    !quiz
)
    {
        throw new Error('No existe un quiz asociado al id=${id}.');
    }

    return makeQuestion(rl, quiz.question)
        .then(answer => {
        if(answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim()
)
    {
        log(socket,`Respuesta correcta.`, 'green');
    }
else
    {
        log(socket,`Respuesta incorrecta.`, 'red');
    }
})
})
.catch(error => {
        errorlog(socket,error.message);
})
.then(() => {
        rl.prompt();
});}




/** Pregunta todos los quizzes existentes en el modelo en orden aleatorio
 * Se gana si se contesta a todos satisfactoriamente.
 *
 * @param rl Objeto realine usado para implementar CLI
 */
exports.playCmd = (socket,rl) => {
    let score = 0;
    let toBePlayed = [];

    const playOne = () => {

        return Promise.resolve()
            .then (() => {
            if (toBePlayed.length <= 0) {
            log(socket, `Fin del juego. Aciertos: `);  //Fin del juego
            return;
        }
        let pos = Math.floor(Math.random() * toBePlayed.length);
        let quiz = toBePlayed[pos];
        toBePlayed.splice(pos, 1);

        return makeQuestion(rl, quiz.question)
            .then(answer => {
            if(answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim()) {
            score++;
            log(socket,`Respuesta correcta.`, 'green');
            return playOne();
        } else {
            log(socket,`Respuesta incorrecta.`, 'red');
            log(socket,`Fin del juego. Aciertos: `);
        }
    })
    })
    }

    models.quiz.findAll({raw: true})
        .then(quizzes => {
        toBePlayed = quizzes;
})
.then(() => {
        return playOne();
})
.catch(e => {
        log(socket,"error: " + e);
})
.then(() => {
        log(socket, score);
    rl.prompt();
})
};


exports.creditsCmd = (socket,rl) => {
    log(socket,'Autores de la práctica:');
    log(socket,'Isabel Maria Rodriguez Marquez', 'green');
    rl.prompt();
};


exports.quitCmd = (socket,rl) => {
    rl.close();
    socket.end();
    rl.prompt();
};

