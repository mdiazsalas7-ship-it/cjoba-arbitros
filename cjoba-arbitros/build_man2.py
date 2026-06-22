import json
M = [
("i","Mecánica · 2 árbitros (2PO) v1.0a","Resumen de la mecánica oficial FIBA para arbitraje a dos (2PO 2024), la más usada en partidos nacionales. Se apoya en las Técnicas Individuales de Arbitraje (IOT). Los diagramas de áreas y posiciones están en el documento oficial."),
("1","Técnicas individuales (IOT)","FIBA pone las Técnicas Individuales de Arbitraje (IOT) como base tanto del 2PO como del 3PO: son las destrezas para observar la jugada completa, ubicarse bien y procesar la decisión antes de pitar."),
("2","Los dos árbitros","Trabajan en pareja: uno como Referee (principal) y otro como Umpire (auxiliar). Ambos tienen la misma autoridad para sancionar faltas y violaciones; solo el Referee decide en casos especiales o de desacuerdo."),
("3","Reparto on-ball / off-ball","Uno cubre el balón (el jugador con balón y su defensor) y el otro lo que ocurre lejos del balón. El error más común es que los dos miren el balón a la vez."),
("4","Las 6 áreas de la cancha","Cada media cancha se divide en seis rectángulos (1 a 6) para definir de quién es cada jugada, de modo que cada árbitro sepa su zona primaria y no haya dudas de responsabilidad."),
("5","Posición del Lead","Trabaja en la línea de fondo, del lado del balón (lado fuerte), cerca de la canasta. Cubre el poste bajo, las faltas debajo del aro y el fondo de su lado."),
("6","Posición del Trail","Va detrás de la jugada, hacia la línea central y dentro de la cancha. Cubre el perímetro, a los tiradores (incluida la línea de 3), el reloj de lanzamiento y las cuentas de la pista de defensa."),
("7","Mantener la diagonal","Los dos árbitros quedan en diagonal opuesta, con la jugada 'encajonada' entre ellos; así siempre hay dos ángulos distintos sobre el balón y los jugadores."),
("8","Lado fuerte y lado débil","El lado del balón es el fuerte; el contrario, el débil. El Lead se desplaza por el fondo hacia el balón y el Trail abre el ángulo hacia el lado contrario para cubrir el débil."),
("9","Cobertura del balón","El árbitro on-ball sigue al jugador con balón; cuando este penetra o el balón cambia de lado, ambos ajustan su posición para no quedar pegados a la jugada (mantener distancia y ángulo)."),
("10","Penetración a canasta","En todo tiro o penetración al aro, el árbitro responsable enfoca el contacto en el aire y el aterrizaje; el compañero observa al resto de jugadores y el rebote."),
("11","Transición · Lead","Al cambiar de canasta, el nuevo Lead corre rápido por la banda hasta la línea de fondo, recto y mirando la cancha, para llegar antes que la jugada y quedar listo para pitar."),
("12","Transición · Trail","El nuevo Trail va detrás de la jugada, sin adelantarse, controlando el balón, los relojes y a los jugadores rezagados. Es el último en llegar."),
("13","Cambio de posición","Tras pitar una falta, por lo general el árbitro que la sancionó pasa a Trail y ambos intercambian Lead/Trail. Así se reparte el esfuerzo físico y se mantiene la diagonal de cobertura."),
("14","Cobertura de tiros","El Lead cubre los tiros cercanos (2 puntos) de su lado; el Trail cubre los de media y larga distancia, señala el intento de 3 y lo valida si entra."),
("15","Interposición e interferencia","El árbitro contrario al tiro es el responsable de juzgar la interposición y la interferencia sobre el balón y el aro, mientras el otro sigue el juego de los demás."),
("16","Cobertura del rebote","Al lanzarse el tiro, cada árbitro vigila los emparejamientos de su zona: el Lead, los duelos cerca del aro; el Trail, los empujones y 'over-the-back' del perímetro. No se abandona el rebote por seguir el balón."),
("17","Saques de banda y fondo","El árbitro más cercano administra el saque y pone el balón a disposición; el otro se reubica para mantener la cobertura. Antes de reanudar debe quedar clara la diagonal."),
("18","Tiros libres","El Lead se coloca en la línea de fondo (administra, vigila al tirador y la línea); el Trail arriba, cubriendo a los jugadores tras la línea de tiros libres prolongada y la de 3. Se indica el número de tiros con la señal oficial."),
("19","Presión a toda la cancha","Con defensa presionante, el Trail se mantiene por detrás del balón controlando la cuenta y el campo atrás, y el Lead se adelanta para cubrir la pista de ataque y los pases largos."),
("20","Tiempos muertos","Los árbitros se colocan en posiciones definidas (uno cerca de la mesa), vigilan a los equipos y reanudan a tiempo, comprobando jugadores en cancha y relojes."),
("21","Sustituciones","Las administra el árbitro más cercano a la mesa, con rapidez, verificando el número correcto de jugadores y avisando al compañero con contacto visual antes de reanudar."),
("22","Últimos 2 minutos","En los últimos 2:00 del último cuarto o prórroga, máxima atención al reloj, a los saques (decisión del entrenador de sacar desde defensa o ataque cuando corresponde) y a la comunicación entre ambos."),
("23","Último tiro del periodo","Uno de los dos queda como responsable de decidir si el tiro salió antes de la señal de fin; ante la duda, se consultan y el Referee toma la decisión final."),
("24","Señales","Usar solo las señales oficiales FIBA, con un silbato fuerte y seco, una sola vez por falta o violación. La señal debe ser clara para jugadores, mesa y público."),
("25","Trabajo en equipo","La cooperación es vital: contacto visual constante, repartir responsabilidades y confiar en el compañero. La autoridad es igual para ambos, sin importar la experiencia."),
]
out = [{"num": n, "art": a, "resumen_propio": s} for (n,a,s) in M]
json.dump(out, open("src/data/manuales2.json","w"), ensure_ascii=False, indent=1)
print("Secciones 2PO:", len(out))
