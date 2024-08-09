// Importation des modules nécessaires
const { Server } = require("socket.io");
const http = require("http");

// Création du serveur HTTP
const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "*", // Permet les requêtes cross-origin depuis n'importe quelle origine
    methods: ["GET", "POST"], // Méthodes HTTP autorisées
  },
});

// Objet pour stocker les membres par salle
const roomMembers = {};

// Gestion des connexions
io.on("connection", (socket) => {
  // Quand un client rejoint une salle
  socket.on("join_room", (data) => {
    const { roomId, member, teamMembers, retroLinesWithAnswers } = data;

    // Initialiser la salle si elle n'existe pas
    if (!roomMembers[roomId]) {
      roomMembers[roomId] = [];
    }

    // Rejoindre la salle
    socket.join(roomId);
    roomMembers[roomId].push(member);

    // Envoyer la liste initiale des membres au client
    socket.emit("initial_members", roomMembers[roomId]);

    // Notifier les autres membres de la salle qu'un nouveau membre a rejoint
    socket
      .to(roomId)
      .emit("member_joined", { member, teamMembers, retroLinesWithAnswers });

    // Gestion de la mise à jour des lignes rétro avec réponses
    socket.on(
      "update_retro_lines_with_answers",
      (updatedRetroLinesWithAnswers) => {
        socket
          .to(roomId)
          .emit(
            "retro_lines_with_answers_updated",
            updatedRetroLinesWithAnswers
          );
      }
    );

    // Gestion de la déconnexion d'un membre
    socket.on("disconnect", () => {
      // Filtrer le membre déconnecté de la liste
      roomMembers[roomId] = roomMembers[roomId].filter(
        (m) => m.id !== member.id
      );

      // Notifier les autres membres de la déconnexion
      socket.to(roomId).emit("member_left", member.id);
    });
  });
});

// Démarrer le serveur sur le port désiré
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
